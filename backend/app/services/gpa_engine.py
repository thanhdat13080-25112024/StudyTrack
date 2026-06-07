"""GPA/CPA engine — VN 10→letter→4.0 conversion, classification, weighted
GPA/CPA, credit progress, and what-if planning. Pure functions over a
configurable GradeScale (default = VN standard); the backend is the source of
truth, mirrored client-side in frontend/src/lib/gpa.ts."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GradeBand:
    letter: str
    min_10: float  # inclusive lower bound on the 0–10 scale
    grade_4: float


@dataclass(frozen=True)
class ClassTier:
    key: str
    min_cpa: float  # inclusive lower bound on the 4.0 scale


@dataclass(frozen=True)
class GradeScale:
    bands: tuple[GradeBand, ...]
    tiers: tuple[ClassTier, ...]


# Default VN scale. Bands ordered high→low: first whose min_10 <= grade wins.
DEFAULT_SCALE = GradeScale(
    bands=(
        GradeBand("A", 8.5, 4.0),
        GradeBand("B+", 8.0, 3.5),
        GradeBand("B", 7.0, 3.0),
        GradeBand("C+", 6.5, 2.5),
        GradeBand("C", 5.5, 2.0),
        GradeBand("D+", 5.0, 1.5),
        GradeBand("D", 4.0, 1.0),
        GradeBand("F", 0.0, 0.0),
    ),
    tiers=(
        ClassTier("xuat_sac", 3.6),
        ClassTier("gioi", 3.2),
        ClassTier("kha", 2.5),
        ClassTier("trung_binh", 2.0),
        ClassTier("yeu", 0.0),
    ),
)


def grade_to_letter(grade_10: float, scale: GradeScale = DEFAULT_SCALE) -> str:
    for band in scale.bands:
        if grade_10 >= band.min_10:
            return band.letter
    return scale.bands[-1].letter


def letter_to_grade4(letter: str, scale: GradeScale = DEFAULT_SCALE) -> float:
    for band in scale.bands:
        if band.letter == letter:
            return band.grade_4
    raise ValueError(f"unknown letter {letter!r}")


def grade_to_grade4(grade_10: float, scale: GradeScale = DEFAULT_SCALE) -> float:
    return letter_to_grade4(grade_to_letter(grade_10, scale), scale)


def classify(cpa: float, scale: GradeScale = DEFAULT_SCALE) -> str:
    for tier in scale.tiers:
        if cpa >= tier.min_cpa:
            return tier.key
    return scale.tiers[-1].key


GRADED_STATUSES = {"passed", "failed"}
CREDIT_EARNING_STATUSES = {"passed", "exempt"}


@dataclass(frozen=True)
class GradeRow:
    course_id: int
    semester_id: int
    semester_code: str  # sortable; "latest" retake = max code
    credits: int
    grade_10: float | None
    status: str


def _in_gpa(row: GradeRow) -> bool:
    return row.status in GRADED_STATUSES and row.grade_10 is not None


def _weighted(rows: list[GradeRow], scale: GradeScale) -> dict:
    credits = sum(r.credits for r in rows)
    if credits == 0:
        return {"gpa": 0.0, "credits": 0}
    qp = sum(grade_to_grade4(r.grade_10, scale) * r.credits for r in rows)  # type: ignore[arg-type]
    return {"gpa": round(qp / credits, 2), "credits": credits}


def semester_gpa(rows: list[GradeRow], scale: GradeScale = DEFAULT_SCALE) -> dict:
    return _weighted([r for r in rows if _in_gpa(r)], scale)


def _latest_per_course(rows: list[GradeRow]) -> list[GradeRow]:
    best: dict[int, GradeRow] = {}
    for r in rows:
        if not _in_gpa(r):
            continue
        cur = best.get(r.course_id)
        if cur is None or r.semester_code > cur.semester_code:
            best[r.course_id] = r
    return list(best.values())


def cumulative_cpa(rows: list[GradeRow], scale: GradeScale = DEFAULT_SCALE) -> dict:
    out = _weighted(_latest_per_course(rows), scale)
    return {"cpa": out["gpa"], "credits": out["credits"]}


def credit_progress(rows: list[GradeRow], total_required: int | None) -> dict:
    earned_by_course: dict[int, int] = {}
    for r in rows:
        if r.status in CREDIT_EARNING_STATUSES:
            earned_by_course[r.course_id] = r.credits
    in_progress = sum(
        r.credits for r in rows if r.status == "in_progress" and r.course_id not in earned_by_course
    )
    earned = sum(earned_by_course.values())
    required = total_required or 0
    remaining = max(0, required - earned) if total_required else 0
    return {
        "earned": earned,
        "in_progress": in_progress,
        "remaining": remaining,
        "required": required,
    }


def gpa_summary(
    rows: list[GradeRow], total_required: int | None, scale: GradeScale = DEFAULT_SCALE
) -> dict:
    code_by_sem: dict[int, str] = {}
    by_sem: dict[int, list[GradeRow]] = {}
    for r in rows:
        code_by_sem.setdefault(r.semester_id, r.semester_code)
        by_sem.setdefault(r.semester_id, []).append(r)
    semesters = []
    for sid in sorted(by_sem, key=lambda s: code_by_sem[s]):
        sg = semester_gpa(by_sem[sid], scale)
        semesters.append(
            {
                "semester_id": sid,
                "code": code_by_sem[sid],
                "gpa": sg["gpa"],
                "credits": sg["credits"],
            }
        )
    cpa = cumulative_cpa(rows, scale)["cpa"]
    return {
        "cpa": cpa,
        "classification": classify(cpa, scale),
        "credits": credit_progress(rows, total_required),
        "semesters": semesters,
    }


def goal_seek(
    current_cpa: float,
    completed_credits: int,
    target_cpa: float,
    total_required: int | None,
    scale: GradeScale = DEFAULT_SCALE,
) -> dict:
    """completed_credits = the CPA denominator (graded credits so far). v1 does
    not subtract exempt credits from `remaining` — documented simplification."""
    remaining = max(0, (total_required or 0) - completed_credits)
    target_tier = classify(target_cpa, scale)
    if remaining == 0:
        met = current_cpa >= target_cpa
        return {
            "required_avg": None,
            "feasible": met,
            "already_met": met,
            "max_reachable_cpa": round(current_cpa, 2),
            "remaining_credits": 0,
            "target_tier": target_tier,
        }
    total = completed_credits + remaining
    required_avg = (target_cpa * total - current_cpa * completed_credits) / remaining
    max_reachable = (current_cpa * completed_credits + 4.0 * remaining) / total
    return {
        "required_avg": round(required_avg, 2),
        "feasible": required_avg <= 4.0,
        "already_met": current_cpa >= target_cpa,
        "max_reachable_cpa": round(max_reachable, 2),
        "remaining_credits": remaining,
        "target_tier": target_tier,
    }


def project(
    current_cpa: float,
    completed_credits: int,
    hypotheticals: list[dict],
    scale: GradeScale = DEFAULT_SCALE,
) -> dict:
    add_qp = sum(grade_to_grade4(h["grade_10"], scale) * h["credits"] for h in hypotheticals)
    add_cr = sum(h["credits"] for h in hypotheticals)
    denom = completed_credits + add_cr
    projected = (current_cpa * completed_credits + add_qp) / denom if denom else 0.0
    return {"projected_cpa": round(projected, 2), "projected_tier": classify(projected, scale)}

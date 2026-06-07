"""Direction analysis — rule-based MVP. Ranks category strengths (avg grade_4
per course category), flags overloaded semesters (credits over the cap), and
reports active courses with unsatisfied prerequisites. Structured output only;
the frontend localizes any advice wording. No track/career taxonomy in v1."""

from __future__ import annotations

from dataclasses import dataclass

_SATISFIED = {"passed", "exempt"}


@dataclass(frozen=True)
class DirCourse:
    course_id: int
    category: str | None
    credits: int
    grade_4: float | None  # latest graded grade_4 (None if not graded)
    semester_code: str | None  # real or planned semester this course sits in


def analyze_direction(courses: list[DirCourse], cap: int) -> dict:
    by_cat: dict[str, list[float]] = {}
    for c in courses:
        if c.grade_4 is not None and c.category:
            by_cat.setdefault(c.category, []).append(c.grade_4)
    category_strengths = [
        {"category": cat, "avg_grade_4": round(sum(v) / len(v), 2), "count": len(v)}
        for cat, v in sorted(by_cat.items())
    ]
    strongest = max(category_strengths, key=lambda s: s["avg_grade_4"], default=None)

    cr_by_sem: dict[str, int] = {}
    for c in courses:
        if c.semester_code:
            cr_by_sem[c.semester_code] = cr_by_sem.get(c.semester_code, 0) + c.credits
    overloaded = [
        {"code": code, "total_credits": cr} for code, cr in sorted(cr_by_sem.items()) if cr > cap
    ]
    return {
        "category_strengths": category_strengths,
        "strongest_category": strongest["category"] if strongest else None,
        "overloaded_semesters": overloaded,
    }


def find_missing_prerequisites(
    active_ids: set[int],
    status_by_course: dict[int, str],
    edges: list[tuple[int, int]],
    codes_by_course: dict[int, str],
) -> list[dict]:
    """For each active (in_progress or planned) course, list prerequisites that
    are not yet passed/exempt."""
    out: dict[int, list[int]] = {}
    for course_id, prereq_id in edges:
        if course_id not in active_ids:
            continue
        if status_by_course.get(prereq_id) not in _SATISFIED:
            out.setdefault(course_id, []).append(prereq_id)
    return [
        {"course_id": cid, "code": codes_by_course.get(cid), "missing": sorted(pids)}
        for cid, pids in sorted(out.items())
    ]

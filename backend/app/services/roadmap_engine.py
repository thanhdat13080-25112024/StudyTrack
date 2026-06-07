"""Roadmap engine — topological sort of remaining courses across future
semesters under a per-semester credit cap. Pure functions; the backend is the
source of truth. v1 assumes 2 terms/year for semester-code generation (no
summer terms). The caller decides the ``remaining`` set (courses not yet
passed/exempt and not in_progress)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RoadmapCourse:
    course_id: int
    code: str
    name: str
    credits: int
    is_required: bool


def next_semester_code(code: str) -> str:
    """v1: 2 terms/year. '2024-1'->'2024-2'->'2025-1'."""
    year_s, term_s = code.split("-")
    year, term = int(year_s), int(term_s)
    if term >= 2:
        return f"{year + 1}-1"
    return f"{year}-{term + 1}"


def generate_roadmap(
    remaining: list[RoadmapCourse],
    edges: list[tuple[int, int]],  # (course_id, prereq_course_id)
    credits_cap: int,
    start_code: str,
    expected_graduation: str | None = None,
    max_semesters: int = 20,
) -> dict:
    remaining_ids = {c.course_id for c in remaining}
    by_id = {c.course_id: c for c in remaining}

    prereqs: dict[int, set[int]] = {cid: set() for cid in remaining_ids}
    unlocks: dict[int, int] = {cid: 0 for cid in remaining_ids}
    for course_id, prereq_id in edges:
        if course_id in remaining_ids and prereq_id in remaining_ids:
            prereqs[course_id].add(prereq_id)
            unlocks[prereq_id] = unlocks.get(prereq_id, 0) + 1

    placed: set[int] = set()
    semesters: list[dict] = []
    warnings: list[dict] = []
    code = start_code

    while len(placed) < len(remaining_ids) and len(semesters) < max_semesters:
        available = sorted(
            (cid for cid in remaining_ids if cid not in placed and prereqs[cid] <= placed),
            key=lambda cid: (not by_id[cid].is_required, -unlocks.get(cid, 0), by_id[cid].code),
        )
        if not available:
            break  # remaining courses are blocked (cycle)
        sem_courses: list[RoadmapCourse] = []
        total = 0
        for cid in available:
            c = by_id[cid]
            if not sem_courses and c.credits > credits_cap:
                sem_courses.append(c)  # oversized course gets its own semester
                total = c.credits
                break
            if total + c.credits <= credits_cap:
                sem_courses.append(c)
                total += c.credits
        for c in sem_courses:
            placed.add(c.course_id)
        semesters.append(
            {
                "code": code,
                "courses": [
                    {
                        "course_id": c.course_id,
                        "code": c.code,
                        "name": c.name,
                        "credits": c.credits,
                        "is_required": c.is_required,
                    }
                    for c in sem_courses
                ],
                "total_credits": total,
            }
        )
        if expected_graduation is not None and code > expected_graduation:
            warnings.append({"type": "exceeds_graduation", "detail": code})
        code = next_semester_code(code)

    unplaced = remaining_ids - placed
    if unplaced:
        warnings.append({"type": "cycle", "course_ids": sorted(unplaced)})
    return {"semesters": semesters, "warnings": warnings}

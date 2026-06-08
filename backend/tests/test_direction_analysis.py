from app.services.direction_analysis import (
    DirCourse,
    analyze_direction,
    find_missing_prerequisites,
)


def _d(cid, category, grade_4, credits=3, code="2024-1"):
    return DirCourse(
        course_id=cid, category=category, credits=credits, grade_4=grade_4, semester_code=code
    )


def test_category_strengths_and_strongest():
    out = analyze_direction(
        [_d(1, "specialized", 4.0), _d(2, "specialized", 3.0), _d(3, "general", 2.0)], cap=24
    )
    spec = next(s for s in out["category_strengths"] if s["category"] == "specialized")
    assert spec["avg_grade_4"] == 3.5 and spec["count"] == 2
    assert out["strongest_category"] == "specialized"


def test_overloaded_semester_flagged_strictly_over_cap():
    out = analyze_direction(
        [
            _d(1, "general", 3.0, credits=10, code="2025-1"),
            _d(2, "general", 3.0, credits=8, code="2025-1"),
        ],
        cap=15,
    )
    assert out["overloaded_semesters"] == [{"code": "2025-1", "total_credits": 18}]


def test_missing_prerequisites():
    status = {
        2: "passed"
    }  # course 1 active (no grade), prereq 2 passed; course 3 prereq 4 not taken
    edges = [(1, 2), (3, 4)]
    active = {1, 3}
    out = find_missing_prerequisites(active, status, edges, {1: "C1", 3: "C3"})
    assert out == [{"course_id": 3, "code": "C3", "missing": [4]}]

from app.services.roadmap_engine import RoadmapCourse, generate_roadmap, next_semester_code


def _c(cid, code, credits, required=True):
    return RoadmapCourse(course_id=cid, code=code, name=code, credits=credits, is_required=required)


def test_next_semester_code_two_terms_per_year():
    assert next_semester_code("2024-1") == "2024-2"
    assert next_semester_code("2024-2") == "2025-1"


def test_empty_remaining_yields_no_semesters():
    out = generate_roadmap([], [], credits_cap=24, start_code="2025-1")
    assert out["semesters"] == []
    assert out["warnings"] == []


def test_prereq_precedes_dependent():
    # course 2 (A) requires course 1 (B)
    courses = [_c(1, "B", 3), _c(2, "A", 3)]
    out = generate_roadmap(courses, [(2, 1)], credits_cap=3, start_code="2025-1")
    sem_of = {c["course_id"]: i for i, s in enumerate(out["semesters"]) for c in s["courses"]}
    assert sem_of[1] < sem_of[2]


def test_credit_cap_respected():
    courses = [_c(1, "C1", 4), _c(2, "C2", 4), _c(3, "C3", 4)]
    out = generate_roadmap(courses, [], credits_cap=8, start_code="2025-1")
    for s in out["semesters"]:
        assert s["total_credits"] <= 8


def test_oversized_course_placed_alone():
    courses = [_c(1, "BIG", 30), _c(2, "S", 3)]
    out = generate_roadmap(courses, [], credits_cap=10, start_code="2025-1")
    big_sem = next(s for s in out["semesters"] if any(c["course_id"] == 1 for c in s["courses"]))
    assert [c["course_id"] for c in big_sem["courses"]] == [1]


def test_required_placed_before_elective():
    courses = [_c(1, "ELEC", 3, required=False), _c(2, "REQ", 3, required=True)]
    out = generate_roadmap(courses, [], credits_cap=3, start_code="2025-1")
    assert out["semesters"][0]["courses"][0]["course_id"] == 2


def test_cycle_is_reported_not_crashed():
    courses = [_c(1, "X", 3), _c(2, "Y", 3)]
    out = generate_roadmap(courses, [(1, 2), (2, 1)], credits_cap=24, start_code="2025-1")
    assert out["semesters"] == []
    assert any(w["type"] == "cycle" for w in out["warnings"])

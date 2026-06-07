import pytest
from app.services.gpa_engine import classify, grade_to_grade4, grade_to_letter


@pytest.mark.parametrize(
    "grade,letter",
    [
        (10, "A"),
        (8.5, "A"),
        (8.4, "B+"),
        (8.0, "B+"),
        (7.9, "B"),
        (7.0, "B"),
        (6.9, "C+"),
        (6.5, "C+"),
        (6.4, "C"),
        (5.5, "C"),
        (5.4, "D+"),
        (5.0, "D+"),
        (4.9, "D"),
        (4.0, "D"),
        (3.9, "F"),
        (0, "F"),
    ],
)
def test_grade_to_letter_boundaries(grade, letter):
    assert grade_to_letter(grade) == letter


@pytest.mark.parametrize(
    "grade,g4",
    [(10, 4.0), (8.0, 3.5), (7.0, 3.0), (6.5, 2.5), (5.5, 2.0), (5.0, 1.5), (4.0, 1.0), (3.9, 0.0)],
)
def test_grade_to_grade4(grade, g4):
    assert grade_to_grade4(grade) == g4


@pytest.mark.parametrize(
    "cpa,tier",
    [
        (4.0, "xuat_sac"),
        (3.6, "xuat_sac"),
        (3.59, "gioi"),
        (3.2, "gioi"),
        (3.19, "kha"),
        (2.5, "kha"),
        (2.49, "trung_binh"),
        (2.0, "trung_binh"),
        (1.99, "yeu"),
        (0.0, "yeu"),
    ],
)
def test_classify_boundaries(cpa, tier):
    assert classify(cpa) == tier


from app.services.gpa_engine import (  # noqa: E402
    GradeRow,
    credit_progress,
    cumulative_cpa,
    gpa_summary,
    semester_gpa,
)


def _row(course_id, sem, credits, grade_10, status):
    return GradeRow(
        course_id=course_id,
        semester_id=sem,
        semester_code=f"2024-{sem}",
        credits=credits,
        grade_10=grade_10,
        status=status,
    )


def test_semester_gpa_weighted():
    rows = [_row(1, 1, 3, 8.0, "passed"), _row(2, 1, 2, 6.0, "passed")]  # 3.5*3 + 2.0*2
    out = semester_gpa(rows)
    assert out["credits"] == 5
    assert out["gpa"] == round((3.5 * 3 + 2.0 * 2) / 5, 2)  # 2.9


def test_failed_counts_zero_in_denominator():
    rows = [_row(1, 1, 3, 8.0, "passed"), _row(2, 1, 3, 3.0, "failed")]
    out = semester_gpa(rows)
    assert out["credits"] == 6
    assert out["gpa"] == round((3.5 * 3 + 0.0 * 3) / 6, 2)  # 1.75


def test_in_progress_and_exempt_excluded_from_average():
    rows = [
        _row(1, 1, 3, 8.0, "passed"),
        _row(2, 1, 3, None, "in_progress"),
        _row(3, 1, 3, None, "exempt"),
    ]
    out = semester_gpa(rows)
    assert out["credits"] == 3 and out["gpa"] == 3.5


def test_retake_latest_wins_for_cpa():
    rows = [_row(1, 1, 3, 4.0, "failed"), _row(1, 2, 3, 7.5, "passed")]  # latest = B (3.0)
    assert cumulative_cpa(rows)["cpa"] == 3.0
    assert cumulative_cpa(rows)["credits"] == 3


def test_cpa_empty():
    assert cumulative_cpa([])["cpa"] == 0.0


def test_credit_progress():
    rows = [
        _row(1, 1, 3, 8.0, "passed"),
        _row(2, 1, 2, None, "exempt"),
        _row(3, 1, 4, None, "in_progress"),
        _row(4, 1, 3, 3.0, "failed"),
    ]
    out = credit_progress(rows, total_required=140)
    assert out == {"earned": 5, "in_progress": 4, "remaining": 135, "required": 140}


def test_gpa_summary_shape():
    rows = [_row(1, 1, 3, 8.0, "passed"), _row(2, 2, 3, 6.0, "passed")]
    out = gpa_summary(rows, total_required=140)
    assert out["cpa"] == round((3.5 * 3 + 2.0 * 3) / 6, 2)
    assert out["classification"] == classify(out["cpa"])
    assert [s["code"] for s in out["semesters"]] == ["2024-1", "2024-2"]
    assert out["credits"]["earned"] == 6


from app.services.gpa_engine import goal_seek, project  # noqa: E402


def test_goal_seek_required_avg():
    # current 3.0 over 90 cr, target 3.3 over 140 cr → need on remaining 50
    out = goal_seek(current_cpa=3.0, completed_credits=90, target_cpa=3.3, total_required=140)
    assert out["remaining_credits"] == 50
    assert out["required_avg"] == round((3.3 * 140 - 3.0 * 90) / 50, 2)  # 3.84
    assert out["feasible"] is True
    assert out["already_met"] is False
    assert out["target_tier"] == "gioi"


def test_goal_seek_infeasible():
    out = goal_seek(current_cpa=2.0, completed_credits=120, target_cpa=3.9, total_required=140)
    assert out["feasible"] is False  # required_avg > 4.0
    assert out["max_reachable_cpa"] == round((2.0 * 120 + 4.0 * 20) / 140, 2)


def test_goal_seek_already_met():
    out = goal_seek(current_cpa=3.6, completed_credits=100, target_cpa=3.2, total_required=140)
    assert out["already_met"] is True  # required_avg <= 0


def test_goal_seek_no_remaining_credits():
    out = goal_seek(current_cpa=3.1, completed_credits=140, target_cpa=3.2, total_required=140)
    assert out["remaining_credits"] == 0
    assert out["required_avg"] is None
    assert out["feasible"] is False  # 3.1 < 3.2 and nothing left to change


def test_project():
    out = project(
        current_cpa=3.0,
        completed_credits=90,
        hypotheticals=[
            {"credits": 3, "grade_10": 8.0},
            {"credits": 4, "grade_10": 7.0},
        ],
    )  # +3.5*3 + 3.0*4 over 90+7
    assert out["projected_cpa"] == round((3.0 * 90 + 3.5 * 3 + 3.0 * 4) / 97, 2)
    assert out["projected_tier"] == classify(out["projected_cpa"])


def test_project_empty_base():
    out = project(
        current_cpa=0.0, completed_credits=0, hypotheticals=[{"credits": 3, "grade_10": 9.0}]
    )
    assert out["projected_cpa"] == 4.0

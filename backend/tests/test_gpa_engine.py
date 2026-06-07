import pytest

from app.services.gpa_engine import classify, grade_to_grade4, grade_to_letter


@pytest.mark.parametrize(
    "grade,letter",
    [
        (10, "A"), (8.5, "A"), (8.4, "B+"), (8.0, "B+"), (7.9, "B"),
        (7.0, "B"), (6.9, "C+"), (6.5, "C+"), (6.4, "C"), (5.5, "C"),
        (5.4, "D+"), (5.0, "D+"), (4.9, "D"), (4.0, "D"), (3.9, "F"), (0, "F"),
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
        (4.0, "xuat_sac"), (3.6, "xuat_sac"), (3.59, "gioi"), (3.2, "gioi"),
        (3.19, "kha"), (2.5, "kha"), (2.49, "trung_binh"), (2.0, "trung_binh"),
        (1.99, "yeu"), (0.0, "yeu"),
    ],
)
def test_classify_boundaries(cpa, tier):
    assert classify(cpa) == tier

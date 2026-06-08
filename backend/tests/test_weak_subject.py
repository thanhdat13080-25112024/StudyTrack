from app.services.weak_subject import WeakInput, detect_weak_subjects


def _w(cid=1, status="in_progress", grade_4=None, credits=3, minutes=0, prereq_ok=True):
    return WeakInput(
        course_id=cid,
        code=f"C{cid}",
        name=f"C{cid}",
        credits=credits,
        status=status,
        grade_4=grade_4,
        linked_minutes=minutes,
        prereq_satisfied=prereq_ok,
    )


def test_low_grade_flags_yellow():
    out = detect_weak_subjects([_w(status="passed", grade_4=1.0)])
    assert out[0]["priority"] == "yellow"
    assert "low_grade" in out[0]["signals"]


def test_failed_status_is_red():
    out = detect_weak_subjects([_w(status="failed", grade_4=0.0)])
    assert out[0]["priority"] == "red"


def test_in_progress_low_study_flags_yellow():
    out = detect_weak_subjects([_w(status="in_progress", credits=3, minutes=10)])
    assert "low_study" in out[0]["signals"]
    assert out[0]["priority"] == "yellow"


def test_two_signals_is_red():
    # in_progress, under-studied AND prereq not satisfied -> 2 signals -> red
    out = detect_weak_subjects([_w(status="in_progress", credits=3, minutes=10, prereq_ok=False)])
    assert set(out[0]["signals"]) == {"low_study", "failed_prereq"}
    assert out[0]["priority"] == "red"


def test_clean_course_absent():
    out = detect_weak_subjects([_w(status="passed", grade_4=3.0, minutes=999)])
    assert out == []

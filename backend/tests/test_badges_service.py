from app.services.badges import newly_unlocked


def test_returns_keys_in_after_not_before():
    assert newly_unlocked(["first_session"], ["first_session", "focused_5h"]) == ["focused_5h"]


def test_empty_when_no_transition():
    assert newly_unlocked(["first_session"], ["first_session"]) == []


def test_multiple_new():
    assert sorted(newly_unlocked([], ["first_session", "focused_5h"])) == [
        "first_session",
        "focused_5h",
    ]


def test_ignores_lost_keys():
    # badges are monotonic; defensively, keys only in `before` are ignored
    assert newly_unlocked(["a", "b"], ["a"]) == []

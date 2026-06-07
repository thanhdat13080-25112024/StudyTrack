"""Unit tests for dashboard aggregation."""

from __future__ import annotations

from datetime import date
from types import SimpleNamespace

from app.services.dashboard import badges, kpis, seven_day_buckets

TODAY = date(2026, 6, 7)


def _s(minutes: int, d: date) -> SimpleNamespace:
    return SimpleNamespace(actual_minutes=minutes, session_date=d)


def test_kpis_empty() -> None:
    k = kpis([], TODAY)
    assert k == {"today_minutes": 0, "total_minutes": 0, "total_sessions": 0, "streak": 0}


def test_kpis_today_and_totals() -> None:
    rows = [_s(30, TODAY), _s(20, TODAY), _s(50, date(2026, 6, 6))]
    k = kpis(rows, TODAY)
    assert k["today_minutes"] == 50
    assert k["total_minutes"] == 100
    assert k["total_sessions"] == 3
    assert k["streak"] == 2


def test_seven_day_buckets_length_and_order() -> None:
    pts = seven_day_buckets([], TODAY)
    assert len(pts) == 7
    assert pts[0]["date"] == "2026-06-01"
    assert pts[-1]["date"] == "2026-06-07"
    assert all(p["minutes"] == 0 for p in pts)


def test_seven_day_buckets_sums_and_ignores_old() -> None:
    rows = [_s(30, TODAY), _s(15, TODAY), _s(40, date(2026, 6, 1)), _s(99, date(2026, 5, 20))]
    pts = seven_day_buckets(rows, TODAY)
    assert pts[-1]["minutes"] == 45  # today
    assert pts[0]["minutes"] == 40  # 2026-06-01
    assert sum(p["minutes"] for p in pts) == 85  # old one excluded


def test_badges_thresholds() -> None:
    none = badges([])
    assert {b["key"]: b["unlocked"] for b in none} == {
        "first_session": False, "focused_5h": False, "master_20h": False,
    }
    one = badges([_s(10, TODAY)])
    flags = {b["key"]: b["unlocked"] for b in one}
    assert flags["first_session"] is True and flags["focused_5h"] is False
    fivehr = badges([_s(300, TODAY)])
    assert {b["key"]: b["unlocked"] for b in fivehr}["focused_5h"] is True
    master = badges([_s(1200, TODAY)])
    assert {b["key"]: b["unlocked"] for b in master}["master_20h"] is True

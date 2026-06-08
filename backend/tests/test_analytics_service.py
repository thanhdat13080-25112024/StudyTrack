"""Unit tests for the analytics service — pure functions over session-like rows.

TDD: these tests are written FIRST, before the service implementation.
Uses lightweight dataclass stubs (same pattern as test_dashboard_service.py).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta

import pytest
from app.services.analytics import (
    focus_trend,
    hourly_distribution,
    method_effectiveness,
    monthly_comparison,
    productivity_score,
    study_heatmap,
    time_by_course,
    time_by_method,
    weekly_comparison,
)


@dataclass
class FakeSession:
    actual_minutes: int
    planned_minutes: int
    session_date: date
    method: str = "Pomodoro"
    focus: int = 7
    subject: str = "Math"
    course_id: int | None = None
    started_at: datetime | None = None


# ---------------------------------------------------------------------------
# study_heatmap
# ---------------------------------------------------------------------------
class TestStudyHeatmap:
    def test_empty(self):
        result = study_heatmap([], 2025)
        assert result == []

    def test_single_session(self):
        s = FakeSession(actual_minutes=60, planned_minutes=60, session_date=date(2025, 3, 15))
        result = study_heatmap([s], 2025)
        # Should contain exactly one entry for that date
        entry = next((e for e in result if e["date"] == "2025-03-15"), None)
        assert entry is not None
        assert entry["minutes"] == 60

    def test_multiple_sessions_same_day(self):
        d = date(2025, 6, 1)
        sessions = [
            FakeSession(actual_minutes=30, planned_minutes=30, session_date=d),
            FakeSession(actual_minutes=45, planned_minutes=60, session_date=d),
        ]
        result = study_heatmap(sessions, 2025)
        entry = next((e for e in result if e["date"] == "2025-06-01"), None)
        assert entry is not None
        assert entry["minutes"] == 75

    def test_filters_by_year(self):
        sessions = [
            FakeSession(actual_minutes=30, planned_minutes=30, session_date=date(2024, 12, 31)),
            FakeSession(actual_minutes=60, planned_minutes=60, session_date=date(2025, 1, 1)),
        ]
        result = study_heatmap(sessions, 2025)
        dates = [e["date"] for e in result]
        assert "2024-12-31" not in dates
        assert "2025-01-01" in dates


# ---------------------------------------------------------------------------
# time_by_method
# ---------------------------------------------------------------------------
class TestTimeByMethod:
    def test_empty(self):
        assert time_by_method([]) == []

    def test_single_method(self):
        sessions = [
            FakeSession(
                actual_minutes=25,
                planned_minutes=25,
                session_date=date(2025, 1, 1),
                method="Pomodoro",
            ),
            FakeSession(
                actual_minutes=50,
                planned_minutes=60,
                session_date=date(2025, 1, 2),
                method="Pomodoro",
            ),
        ]
        result = time_by_method(sessions)
        assert len(result) == 1
        assert result[0]["method"] == "Pomodoro"
        assert result[0]["total_minutes"] == 75
        assert result[0]["session_count"] == 2

    def test_multiple_methods(self):
        sessions = [
            FakeSession(
                actual_minutes=25,
                planned_minutes=25,
                session_date=date(2025, 1, 1),
                method="Pomodoro",
            ),
            FakeSession(
                actual_minutes=90,
                planned_minutes=90,
                session_date=date(2025, 1, 2),
                method="Deep Work",
            ),
        ]
        result = time_by_method(sessions)
        assert len(result) == 2
        methods = {r["method"] for r in result}
        assert methods == {"Pomodoro", "Deep Work"}


# ---------------------------------------------------------------------------
# time_by_course
# ---------------------------------------------------------------------------
class TestTimeByCourse:
    def test_empty(self):
        assert time_by_course([]) == []

    def test_groups_by_subject(self):
        sessions = [
            FakeSession(
                actual_minutes=30,
                planned_minutes=30,
                session_date=date(2025, 1, 1),
                subject="Math",
                course_id=1,
            ),
            FakeSession(
                actual_minutes=60,
                planned_minutes=60,
                session_date=date(2025, 1, 2),
                subject="Math",
                course_id=1,
            ),
            FakeSession(
                actual_minutes=45,
                planned_minutes=45,
                session_date=date(2025, 1, 3),
                subject="Physics",
                course_id=2,
            ),
        ]
        result = time_by_course(sessions)
        assert len(result) == 2
        math_entry = next(r for r in result if r["subject"] == "Math")
        assert math_entry["total_minutes"] == 90
        assert math_entry["session_count"] == 2

    def test_no_course_id_groups_by_subject(self):
        sessions = [
            FakeSession(
                actual_minutes=30,
                planned_minutes=30,
                session_date=date(2025, 1, 1),
                subject="Math",
                course_id=None,
            ),
            FakeSession(
                actual_minutes=20,
                planned_minutes=20,
                session_date=date(2025, 1, 2),
                subject="Math",
                course_id=None,
            ),
        ]
        result = time_by_course(sessions)
        assert len(result) == 1
        assert result[0]["total_minutes"] == 50


# ---------------------------------------------------------------------------
# focus_trend
# ---------------------------------------------------------------------------
class TestFocusTrend:
    def test_empty(self):
        assert focus_trend([]) == []

    def test_single_day(self):
        sessions = [
            FakeSession(
                actual_minutes=25, planned_minutes=25, session_date=date(2025, 1, 1), focus=8
            ),
            FakeSession(
                actual_minutes=25, planned_minutes=25, session_date=date(2025, 1, 1), focus=6
            ),
        ]
        result = focus_trend(sessions)
        assert len(result) == 1
        assert result[0]["date"] == "2025-01-01"
        assert result[0]["avg_focus"] == 7.0

    def test_multiple_days_sorted(self):
        sessions = [
            FakeSession(
                actual_minutes=25, planned_minutes=25, session_date=date(2025, 1, 3), focus=9
            ),
            FakeSession(
                actual_minutes=25, planned_minutes=25, session_date=date(2025, 1, 1), focus=5
            ),
        ]
        result = focus_trend(sessions)
        assert len(result) == 2
        assert result[0]["date"] == "2025-01-01"
        assert result[1]["date"] == "2025-01-03"


# ---------------------------------------------------------------------------
# weekly_comparison
# ---------------------------------------------------------------------------
class TestWeeklyComparison:
    def test_empty(self):
        today = date(2025, 6, 4)  # Wednesday
        result = weekly_comparison([], today)
        assert result["this_week_minutes"] == 0
        assert result["last_week_minutes"] == 0
        assert result["change_pct"] is None

    def test_sessions_this_week_only(self):
        today = date(2025, 6, 4)  # Wednesday
        # Monday of this week = June 2
        sessions = [
            FakeSession(actual_minutes=60, planned_minutes=60, session_date=date(2025, 6, 2)),
            FakeSession(actual_minutes=30, planned_minutes=30, session_date=date(2025, 6, 3)),
        ]
        result = weekly_comparison(sessions, today)
        assert result["this_week_minutes"] == 90
        assert result["last_week_minutes"] == 0
        assert result["change_pct"] is None  # division by zero → None

    def test_both_weeks(self):
        today = date(2025, 6, 4)  # Wednesday
        sessions = [
            # Last week (Mon May 26 – Sun Jun 1)
            FakeSession(actual_minutes=100, planned_minutes=100, session_date=date(2025, 5, 26)),
            # This week (Mon Jun 2 – Sun Jun 8)
            FakeSession(actual_minutes=120, planned_minutes=120, session_date=date(2025, 6, 2)),
        ]
        result = weekly_comparison(sessions, today)
        assert result["this_week_minutes"] == 120
        assert result["last_week_minutes"] == 100
        assert result["change_pct"] == 20.0


# ---------------------------------------------------------------------------
# monthly_comparison
# ---------------------------------------------------------------------------
class TestMonthlyComparison:
    def test_empty(self):
        result = monthly_comparison([], date(2025, 6, 15))
        assert result["this_month_minutes"] == 0
        assert result["last_month_minutes"] == 0
        assert result["change_pct"] is None

    def test_both_months(self):
        sessions = [
            FakeSession(actual_minutes=200, planned_minutes=200, session_date=date(2025, 5, 15)),
            FakeSession(actual_minutes=300, planned_minutes=300, session_date=date(2025, 6, 10)),
        ]
        result = monthly_comparison(sessions, date(2025, 6, 15))
        assert result["this_month_minutes"] == 300
        assert result["last_month_minutes"] == 200
        assert result["change_pct"] == 50.0


# ---------------------------------------------------------------------------
# productivity_score
# ---------------------------------------------------------------------------
class TestProductivityScore:
    def test_empty(self):
        result = productivity_score([], date(2025, 6, 4))
        assert result["score"] == 0
        assert "components" in result

    def test_nonzero(self):
        today = date(2025, 6, 4)
        sessions = [
            FakeSession(
                actual_minutes=60,
                planned_minutes=60,
                session_date=today - timedelta(days=i),
                focus=8,
            )
            for i in range(7)
        ]
        result = productivity_score(sessions, today)
        assert 0 <= result["score"] <= 100
        assert result["score"] > 0
        assert "consistency" in result["components"]
        assert "volume" in result["components"]
        assert "focus_quality" in result["components"]


# ---------------------------------------------------------------------------
# hourly_distribution
# ---------------------------------------------------------------------------
class TestHourlyDistribution:
    def test_empty(self):
        assert hourly_distribution([]) == []

    def test_skips_sessions_without_started_at(self):
        sessions = [
            FakeSession(
                actual_minutes=30,
                planned_minutes=30,
                session_date=date(2025, 1, 1),
                started_at=None,
            ),
        ]
        assert hourly_distribution(sessions) == []

    def test_buckets_by_hour(self):
        sessions = [
            FakeSession(
                actual_minutes=30,
                planned_minutes=30,
                session_date=date(2025, 1, 1),
                started_at=datetime(2025, 1, 1, 9, 0),
            ),
            FakeSession(
                actual_minutes=60,
                planned_minutes=60,
                session_date=date(2025, 1, 2),
                started_at=datetime(2025, 1, 2, 9, 30),
            ),
            FakeSession(
                actual_minutes=45,
                planned_minutes=45,
                session_date=date(2025, 1, 3),
                started_at=datetime(2025, 1, 3, 14, 0),
            ),
        ]
        result = hourly_distribution(sessions)
        hour_9 = next((e for e in result if e["hour"] == 9), None)
        hour_14 = next((e for e in result if e["hour"] == 14), None)
        assert hour_9 is not None
        assert hour_9["total_minutes"] == 90
        assert hour_14 is not None
        assert hour_14["total_minutes"] == 45


# ---------------------------------------------------------------------------
# method_effectiveness
# ---------------------------------------------------------------------------
class TestMethodEffectiveness:
    def test_empty(self):
        assert method_effectiveness([]) == []

    def test_single_method(self):
        sessions = [
            FakeSession(
                actual_minutes=20,
                planned_minutes=25,
                session_date=date(2025, 1, 1),
                method="Pomodoro",
                focus=8,
            ),
            FakeSession(
                actual_minutes=25,
                planned_minutes=25,
                session_date=date(2025, 1, 2),
                method="Pomodoro",
                focus=6,
            ),
        ]
        result = method_effectiveness(sessions)
        assert len(result) == 1
        assert result[0]["method"] == "Pomodoro"
        assert result[0]["avg_focus"] == 7.0
        # completion rate = (20/25 + 25/25) / 2 = (0.8 + 1.0) / 2 = 0.9
        assert result[0]["avg_completion_rate"] == pytest.approx(0.9, abs=0.01)

    def test_multiple_methods(self):
        sessions = [
            FakeSession(
                actual_minutes=25,
                planned_minutes=25,
                session_date=date(2025, 1, 1),
                method="Pomodoro",
                focus=8,
            ),
            FakeSession(
                actual_minutes=90,
                planned_minutes=90,
                session_date=date(2025, 1, 2),
                method="Deep Work",
                focus=9,
            ),
        ]
        result = method_effectiveness(sessions)
        assert len(result) == 2

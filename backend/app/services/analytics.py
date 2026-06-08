"""Analytics service — pure functions computing study-habit metrics.

All functions take plain data in (session-like objects) and return structured
data out. No DB, no I/O — trivially testable. Nothing is stored; everything
is computed on read from existing StudySession data.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Protocol


class _Row(Protocol):
    actual_minutes: int
    planned_minutes: int
    session_date: date
    method: str
    focus: int
    subject: str
    course_id: int | None
    started_at: datetime | None


# ---------------------------------------------------------------------------
# Heatmap — 365-day GitHub-style calendar
# ---------------------------------------------------------------------------
def study_heatmap(sessions: list[_Row], year: int) -> list[dict]:
    """Aggregate minutes per day for the given calendar year."""
    totals: dict[date, int] = {}
    for s in sessions:
        if s.session_date.year != year:
            continue
        totals[s.session_date] = totals.get(s.session_date, 0) + s.actual_minutes
    return [{"date": d.isoformat(), "minutes": m} for d, m in sorted(totals.items())]


# ---------------------------------------------------------------------------
# Time breakdown by method
# ---------------------------------------------------------------------------
def time_by_method(sessions: list[_Row]) -> list[dict]:
    """Total minutes and session count per study method."""
    agg: dict[str, dict] = {}
    for s in sessions:
        if s.method not in agg:
            agg[s.method] = {"method": s.method, "total_minutes": 0, "session_count": 0}
        agg[s.method]["total_minutes"] += s.actual_minutes
        agg[s.method]["session_count"] += 1
    return sorted(agg.values(), key=lambda x: x["total_minutes"], reverse=True)


# ---------------------------------------------------------------------------
# Time breakdown by course / subject
# ---------------------------------------------------------------------------
def time_by_course(sessions: list[_Row]) -> list[dict]:
    """Total minutes and session count per course (keyed by course_id if
    present, otherwise by subject string)."""
    agg: dict[str, dict] = {}
    for s in sessions:
        key = f"c:{s.course_id}" if s.course_id is not None else f"s:{s.subject}"
        if key not in agg:
            agg[key] = {
                "course_id": s.course_id,
                "subject": s.subject,
                "total_minutes": 0,
                "session_count": 0,
            }
        agg[key]["total_minutes"] += s.actual_minutes
        agg[key]["session_count"] += 1
    return sorted(agg.values(), key=lambda x: x["total_minutes"], reverse=True)


# ---------------------------------------------------------------------------
# Focus trend — daily average focus
# ---------------------------------------------------------------------------
def focus_trend(sessions: list[_Row]) -> list[dict]:
    """Average focus level per day, sorted chronologically."""
    by_day: dict[date, list[int]] = {}
    for s in sessions:
        by_day.setdefault(s.session_date, []).append(s.focus)
    return [
        {"date": d.isoformat(), "avg_focus": round(sum(fs) / len(fs), 1)}
        for d, fs in sorted(by_day.items())
    ]


# ---------------------------------------------------------------------------
# Weekly comparison (ISO week, Mon=0)
# ---------------------------------------------------------------------------
def _week_start(d: date) -> date:
    """Monday of the ISO week containing `d`."""
    return d - timedelta(days=d.weekday())


def weekly_comparison(sessions: list[_Row], today: date) -> dict:
    """Compare total study minutes this ISO week vs last week."""
    this_mon = _week_start(today)
    last_mon = this_mon - timedelta(weeks=1)
    this_end = this_mon + timedelta(days=7)
    this_w = sum(s.actual_minutes for s in sessions if this_mon <= s.session_date < this_end)
    last_w = sum(s.actual_minutes for s in sessions if last_mon <= s.session_date < this_mon)
    change = round((this_w - last_w) / last_w * 100, 1) if last_w > 0 else None
    return {
        "this_week_minutes": this_w,
        "last_week_minutes": last_w,
        "change_pct": change,
    }


# ---------------------------------------------------------------------------
# Monthly comparison
# ---------------------------------------------------------------------------
def monthly_comparison(sessions: list[_Row], today: date) -> dict:
    """Compare total study minutes this calendar month vs last month."""
    this_m = today.month
    this_y = today.year
    last_m = this_m - 1 if this_m > 1 else 12
    last_y = this_y if this_m > 1 else this_y - 1
    cur = sum(
        s.actual_minutes
        for s in sessions
        if s.session_date.year == this_y and s.session_date.month == this_m
    )
    prev = sum(
        s.actual_minutes
        for s in sessions
        if s.session_date.year == last_y and s.session_date.month == last_m
    )
    change = round((cur - prev) / prev * 100, 1) if prev > 0 else None
    return {
        "this_month_minutes": cur,
        "last_month_minutes": prev,
        "change_pct": change,
    }


# ---------------------------------------------------------------------------
# Productivity score (composite 0–100)
# ---------------------------------------------------------------------------
def productivity_score(sessions: list[_Row], today: date) -> dict:
    """Composite score based on consistency, volume, and focus quality.

    Components (each 0–100, weighted equally):
    - consistency: fraction of last 7 days with at least 1 session × 100
    - volume: min(total_minutes_last_7_days / 600, 1) × 100
      (600 min ≈ 10h/week is "full score")
    - focus_quality: avg focus across last 7 days × 10
    """
    if not sessions:
        return {"score": 0, "components": {"consistency": 0, "volume": 0, "focus_quality": 0}}

    week_start = today - timedelta(days=6)
    recent = [s for s in sessions if s.session_date >= week_start]

    # consistency: unique days with sessions in the last 7 days
    unique_days = len({s.session_date for s in recent})
    consistency = round(unique_days / 7 * 100, 1)

    # volume: total minutes capped at 600 (10h)
    total_min = sum(s.actual_minutes for s in recent)
    volume = round(min(total_min / 600, 1.0) * 100, 1)

    # focus quality: avg focus × 10 (focus is 1–10, so max = 100)
    if recent:
        avg_f = sum(s.focus for s in recent) / len(recent)
        focus_quality = round(avg_f * 10, 1)
    else:
        focus_quality = 0

    score = round((consistency + volume + focus_quality) / 3, 0)
    return {
        "score": int(score),
        "components": {
            "consistency": consistency,
            "volume": volume,
            "focus_quality": focus_quality,
        },
    }


# ---------------------------------------------------------------------------
# Hourly distribution (study by hour-of-day)
# ---------------------------------------------------------------------------
def hourly_distribution(sessions: list[_Row]) -> list[dict]:
    """Total study minutes bucketed by hour-of-day (0–23) from started_at.
    Sessions without started_at are skipped."""
    agg: dict[int, int] = {}
    for s in sessions:
        if s.started_at is None:
            continue
        h = s.started_at.hour
        agg[h] = agg.get(h, 0) + s.actual_minutes
    return [{"hour": h, "total_minutes": m} for h, m in sorted(agg.items())]


# ---------------------------------------------------------------------------
# Method effectiveness (avg focus + completion rate per method)
# ---------------------------------------------------------------------------
def method_effectiveness(sessions: list[_Row]) -> list[dict]:
    """Average focus and actual/planned completion rate per method."""
    agg: dict[str, dict] = {}
    for s in sessions:
        if s.method not in agg:
            agg[s.method] = {"focuses": [], "rates": []}
        agg[s.method]["focuses"].append(s.focus)
        rate = s.actual_minutes / s.planned_minutes if s.planned_minutes > 0 else 0
        agg[s.method]["rates"].append(rate)
    return sorted(
        [
            {
                "method": m,
                "avg_focus": round(sum(v["focuses"]) / len(v["focuses"]), 1),
                "avg_completion_rate": round(sum(v["rates"]) / len(v["rates"]), 2),
            }
            for m, v in agg.items()
        ],
        key=lambda x: x["avg_focus"],
        reverse=True,
    )

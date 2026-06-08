"""Weak-subject warning — rule-based flags combining low grade, low logged
study-time per credit (for active courses), and unsatisfied prerequisites.
Priority is red when a course is failed or trips >= 2 signals (e.g. low grade
AND low hours), else yellow. Thresholds are module constants (configurable
later). The router assembles WeakInput from grades + linked sessions + prereqs;
the frontend localizes the signal text."""

from __future__ import annotations

from dataclasses import dataclass

LOW_GRADE_4 = 1.0  # D/F on the 4.0 scale
MIN_PER_CREDIT = 30  # minutes of logged study per credit below which a course is under-studied


@dataclass(frozen=True)
class WeakInput:
    course_id: int
    code: str
    name: str
    credits: int
    status: str  # latest grade status: in_progress / passed / failed / exempt
    grade_4: float | None  # latest graded grade_4 (None if not graded)
    linked_minutes: int  # sum of actual_minutes of sessions linked to this course
    prereq_satisfied: bool  # all prerequisites passed/exempt (True if none)


def detect_weak_subjects(rows: list[WeakInput]) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        signals: list[str] = []
        metrics: dict = {}
        is_failed = r.status == "failed"

        low_grade = is_failed or (r.grade_4 is not None and r.grade_4 <= LOW_GRADE_4)
        if low_grade:
            signals.append("low_grade")
            if r.grade_4 is not None:
                metrics["grade_4"] = r.grade_4

        if r.status in ("in_progress", "failed") and r.credits > 0:
            mpc = r.linked_minutes / r.credits
            if mpc < MIN_PER_CREDIT:
                signals.append("low_study")
                metrics["minutes_per_credit"] = round(mpc, 1)

        if not r.prereq_satisfied:
            signals.append("failed_prereq")

        if not signals:
            continue
        priority = "red" if (is_failed or len(signals) >= 2) else "yellow"
        out.append(
            {
                "course_id": r.course_id,
                "code": r.code,
                "name": r.name,
                "signals": signals,
                "priority": priority,
                "metrics": metrics,
            }
        )
    return out

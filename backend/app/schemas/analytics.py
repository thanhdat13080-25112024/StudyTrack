"""Pydantic v2 response models for the analytics endpoint."""

from __future__ import annotations

from pydantic import BaseModel


class HeatmapPointOut(BaseModel):
    date: str  # YYYY-MM-DD
    minutes: int


class MethodTimeOut(BaseModel):
    method: str
    total_minutes: int
    session_count: int


class CourseTimeOut(BaseModel):
    course_id: int | None
    subject: str
    total_minutes: int
    session_count: int


class FocusPointOut(BaseModel):
    date: str  # YYYY-MM-DD
    avg_focus: float


class WeeklyComparisonOut(BaseModel):
    this_week_minutes: int
    last_week_minutes: int
    change_pct: float | None


class MonthlyComparisonOut(BaseModel):
    this_month_minutes: int
    last_month_minutes: int
    change_pct: float | None


class ProductivityComponentsOut(BaseModel):
    consistency: float
    volume: float
    focus_quality: float


class ProductivityScoreOut(BaseModel):
    score: int
    components: ProductivityComponentsOut


class HourlyPointOut(BaseModel):
    hour: int  # 0–23
    total_minutes: int


class MethodEffectivenessOut(BaseModel):
    method: str
    avg_focus: float
    avg_completion_rate: float


class AnalyticsOut(BaseModel):
    heatmap: list[HeatmapPointOut]
    time_by_method: list[MethodTimeOut]
    time_by_course: list[CourseTimeOut]
    focus_trend: list[FocusPointOut]
    weekly_comparison: WeeklyComparisonOut
    monthly_comparison: MonthlyComparisonOut
    productivity_score: ProductivityScoreOut
    hourly_distribution: list[HourlyPointOut]
    method_effectiveness: list[MethodEffectivenessOut]

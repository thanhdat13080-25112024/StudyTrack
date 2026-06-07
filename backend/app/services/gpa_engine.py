"""GPA/CPA engine — VN 10→letter→4.0 conversion, classification, weighted
GPA/CPA, credit progress, and what-if planning. Pure functions over a
configurable GradeScale (default = VN standard); the backend is the source of
truth, mirrored client-side in frontend/src/lib/gpa.ts."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GradeBand:
    letter: str
    min_10: float  # inclusive lower bound on the 0–10 scale
    grade_4: float


@dataclass(frozen=True)
class ClassTier:
    key: str
    min_cpa: float  # inclusive lower bound on the 4.0 scale


@dataclass(frozen=True)
class GradeScale:
    bands: tuple[GradeBand, ...]
    tiers: tuple[ClassTier, ...]


# Default VN scale. Bands ordered high→low: first whose min_10 <= grade wins.
DEFAULT_SCALE = GradeScale(
    bands=(
        GradeBand("A", 8.5, 4.0),
        GradeBand("B+", 8.0, 3.5),
        GradeBand("B", 7.0, 3.0),
        GradeBand("C+", 6.5, 2.5),
        GradeBand("C", 5.5, 2.0),
        GradeBand("D+", 5.0, 1.5),
        GradeBand("D", 4.0, 1.0),
        GradeBand("F", 0.0, 0.0),
    ),
    tiers=(
        ClassTier("xuat_sac", 3.6),
        ClassTier("gioi", 3.2),
        ClassTier("kha", 2.5),
        ClassTier("trung_binh", 2.0),
        ClassTier("yeu", 0.0),
    ),
)


def grade_to_letter(grade_10: float, scale: GradeScale = DEFAULT_SCALE) -> str:
    for band in scale.bands:
        if grade_10 >= band.min_10:
            return band.letter
    return scale.bands[-1].letter


def letter_to_grade4(letter: str, scale: GradeScale = DEFAULT_SCALE) -> float:
    for band in scale.bands:
        if band.letter == letter:
            return band.grade_4
    raise ValueError(f"unknown letter {letter!r}")


def grade_to_grade4(grade_10: float, scale: GradeScale = DEFAULT_SCALE) -> float:
    return letter_to_grade4(grade_to_letter(grade_10, scale), scale)


def classify(cpa: float, scale: GradeScale = DEFAULT_SCALE) -> str:
    for tier in scale.tiers:
        if cpa >= tier.min_cpa:
            return tier.key
    return scale.tiers[-1].key

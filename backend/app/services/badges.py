"""Badge transition helper — which badge keys became unlocked between two
derived badge-key sets. Reuses the thresholds in services/dashboard.badges()."""

from __future__ import annotations


def newly_unlocked(before_keys: list[str], after_keys: list[str]) -> list[str]:
    """Keys present in `after_keys` but not `before_keys` (order: as in after)."""
    before = set(before_keys)
    return [k for k in after_keys if k not in before]

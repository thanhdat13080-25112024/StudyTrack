"""users: password_changed_at (JWT revocation gate)

Note: revision id kept <= 32 chars (Postgres alembic_version.version_num is
VARCHAR(32)).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0008_password_changed_at"
down_revision = "0007_card_theme_student_code"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_changed_at")

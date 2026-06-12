"""profile: card_theme + student_code

Note: revision id kept <= 32 chars (Postgres alembic_version.version_num is
VARCHAR(32)).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0007_card_theme_student_code"
down_revision = "0006_auth_lifecycle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column(
            "card_theme",
            sa.String(length=20),
            nullable=False,
            server_default="studytrack",
        ),
    )
    op.add_column("profiles", sa.Column("student_code", sa.String(length=30), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "student_code")
    op.drop_column("profiles", "card_theme")

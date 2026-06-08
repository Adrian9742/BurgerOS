"""variacoes_produto

Revision ID: c2d3e4f5a6b7
Revises: b2c3d4e5f6a7
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c2d3e4f5a6b7"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("produtos", sa.Column("variacoes", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("produtos", "variacoes")

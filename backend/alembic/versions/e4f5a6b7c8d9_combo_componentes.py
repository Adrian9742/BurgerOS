"""combo componentes produto

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'e4f5a6b7c8d9'
down_revision = 'd3e4f5a6b7c8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('produtos', sa.Column('componentes', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('produtos', 'componentes')

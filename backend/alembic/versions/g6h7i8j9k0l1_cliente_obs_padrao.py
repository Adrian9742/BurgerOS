"""cliente observacao_padrao

Revision ID: g6h7i8j9k0l1
Revises: f5a6b7c8d9e0
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'g6h7i8j9k0l1'
down_revision = 'f5a6b7c8d9e0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('clientes', sa.Column('observacao_padrao', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('clientes', 'observacao_padrao')

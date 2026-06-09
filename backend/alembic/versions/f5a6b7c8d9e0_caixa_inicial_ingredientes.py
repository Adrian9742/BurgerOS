"""caixa_inicial e tabelas de ingredientes

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'f5a6b7c8d9e0'
down_revision = 'e4f5a6b7c8d9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('turnos', sa.Column('caixa_inicial', sa.Numeric(10, 2), nullable=True))

    op.create_table(
        'ingredientes',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('nome', sa.String(100), nullable=False),
        sa.Column('unidade', sa.String(10), nullable=False),
        sa.Column('estoque', sa.Numeric(10, 3), nullable=False, server_default='0'),
        sa.Column('estoque_minimo', sa.Numeric(10, 3), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'ficha_tecnica',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('produto_id', sa.Integer(), sa.ForeignKey('produtos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ingrediente_id', sa.Integer(), sa.ForeignKey('ingredientes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('quantidade', sa.Numeric(10, 3), nullable=False),
        sa.UniqueConstraint('produto_id', 'ingrediente_id'),
    )


def downgrade():
    op.drop_table('ficha_tecnica')
    op.drop_table('ingredientes')
    op.drop_column('turnos', 'caixa_inicial')

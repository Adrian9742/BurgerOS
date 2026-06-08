"""estoque_e_turnos

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-08 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('produtos', sa.Column('estoque', sa.Integer(), nullable=True))
    op.add_column('produtos', sa.Column('estoque_minimo', sa.Integer(), nullable=True))

    op.create_table(
        'turnos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('abertura', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('fechamento', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_entrada', sa.Numeric(10, 2), default=0, nullable=False),
        sa.Column('total_saida', sa.Numeric(10, 2), default=0, nullable=False),
        sa.Column('pedidos_entregues', sa.Integer(), default=0, nullable=False),
        sa.Column('observacao', sa.String(), nullable=True),
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id'), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('turnos')
    op.drop_column('produtos', 'estoque_minimo')
    op.drop_column('produtos', 'estoque')

"""add_forma_pagamento_pedido

Revision ID: a1b2c3d4e5f6
Revises: 402582435db8
Create Date: 2026-06-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '402582435db8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('pedidos', sa.Column('forma_pagamento', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('pedidos', 'forma_pagamento')

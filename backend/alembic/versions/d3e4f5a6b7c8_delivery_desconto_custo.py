"""delivery desconto custo obs pedido

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'd3e4f5a6b7c8'
down_revision = 'c2d3e4f5a6b7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('pedidos', sa.Column('tipo', sa.String(20), nullable=False, server_default='mesa'))
    op.add_column('pedidos', sa.Column('observacao', sa.String, nullable=True))
    op.add_column('pedidos', sa.Column('desconto', sa.Numeric(10, 2), nullable=True))
    op.add_column('pedidos', sa.Column('desconto_tipo', sa.String(15), nullable=True))
    op.add_column('pedidos', sa.Column('endereco_entrega', sa.String, nullable=True))
    op.add_column('pedidos', sa.Column('taxa_entrega', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('produtos', sa.Column('custo', sa.Numeric(10, 2), nullable=True))


def downgrade():
    op.drop_column('pedidos', 'tipo')
    op.drop_column('pedidos', 'observacao')
    op.drop_column('pedidos', 'desconto')
    op.drop_column('pedidos', 'desconto_tipo')
    op.drop_column('pedidos', 'endereco_entrega')
    op.drop_column('pedidos', 'taxa_entrega')
    op.drop_column('produtos', 'custo')

"""
Add spurs_ok to rider_profiles

Revision ID: 20250908_add_spurs_ok
Revises: 20250908_add_riding_styles
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250908_add_spurs_ok'
down_revision = '20250908_add_riding_styles'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('spurs_ok', sa.Boolean(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('spurs_ok')

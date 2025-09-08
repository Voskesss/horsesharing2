"""
Add riding_styles (JSON) to rider_profiles

Revision ID: 20250908_add_riding_styles
Revises: 20250908_add_comfort_fields
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250908_add_riding_styles'
down_revision = '20250908_add_comfort_fields'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('riding_styles', sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('riding_styles')

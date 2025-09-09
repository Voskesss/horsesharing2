"""
add min_days_per_week and lease_preferences to rider_profiles

Revision ID: 20250909_add_min_days_and_lease_prefs
Revises: 20250908_add_comfort_trail_rides
Create Date: 2025-09-09
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250909_add_min_days_and_lease_prefs'
down_revision = '20250908_add_comfort_trail_rides'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('min_days_per_week', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('lease_preferences', sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('lease_preferences')
        batch_op.drop_column('min_days_per_week')

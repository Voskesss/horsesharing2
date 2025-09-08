"""
add comfortable_with_trail_rides to rider_profiles

Revision ID: 20250908_add_comfort_trail_rides
Revises: 20250908_add_general_skills
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250908_add_comfort_trail_rides'
down_revision = '20250908_add_general_skills'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('comfortable_with_trail_rides', sa.Boolean(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('comfortable_with_trail_rides')

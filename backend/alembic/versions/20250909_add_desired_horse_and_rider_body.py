"""
Add desired_horse JSON and rider body/bio to rider_profiles

Revision ID: 20250909_add_desired_horse_and_rider_body
Revises: 20250909_add_min_days_and_lease_prefs
Create Date: 2025-09-09
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250909_add_desired_horse_and_rider_body'
down_revision = '20250909_add_min_days_and_lease_prefs'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('rider_height_cm', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('rider_weight_kg', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('rider_bio', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('desired_horse', sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('desired_horse')
        batch_op.drop_column('rider_bio')
        batch_op.drop_column('rider_weight_kg')
        batch_op.drop_column('rider_height_cm')

"""
extend horse profile ad fields

Revision ID: 20250909_extend_horse_profile_ad_fields
Revises: 20250909_add_owner_naw_fields
Create Date: 2025-09-09 19:38:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250909_extend_horse_profile_ad_fields'
down_revision = '20250909_add_owner_naw_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.add_column(sa.Column('title', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('ad_type', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('coat_colors', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('level', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('comfort_flags', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('activity_mode', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('required_skills', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('desired_rider_personality', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('rules', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('available_days', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('min_days_per_week', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('session_duration_min', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('session_duration_max', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('cost_model', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('cost_amount', sa.Integer(), nullable=True))

def downgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.drop_column('cost_amount')
        batch_op.drop_column('cost_model')
        batch_op.drop_column('session_duration_max')
        batch_op.drop_column('session_duration_min')
        batch_op.drop_column('min_days_per_week')
        batch_op.drop_column('available_days')
        batch_op.drop_column('rules')
        batch_op.drop_column('desired_rider_personality')
        batch_op.drop_column('required_skills')
        batch_op.drop_column('activity_mode')
        batch_op.drop_column('comfort_flags')
        batch_op.drop_column('level')
        batch_op.drop_column('coat_colors')
        batch_op.drop_column('ad_type')
        batch_op.drop_column('description')
        batch_op.drop_column('title')

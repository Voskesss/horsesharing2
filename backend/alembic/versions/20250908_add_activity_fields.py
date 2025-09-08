"""
Add activity fields to rider_profiles

Revision ID: 20250908_add_activity_fields
Revises: 20250908_add_spurs_ok
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250908_add_activity_fields'
down_revision = '20250908_add_spurs_ok'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('activity_mode', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('activity_preferences', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('mennen_experience', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('mennen_experience')
        batch_op.drop_column('activity_preferences')
        batch_op.drop_column('activity_mode')

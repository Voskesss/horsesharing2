"""
add horse ad_types json

Revision ID: 20250909_add_horse_ad_types
Revises: 20250909_extend_horse_profile_ad_fields
Create Date: 2025-09-09 20:22:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250909_add_horse_ad_types'
down_revision = '20250909_extend_horse_profile_ad_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.add_column(sa.Column('ad_types', sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.drop_column('ad_types')

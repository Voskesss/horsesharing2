"""
add rider videos array

Revision ID: 20250911_add_rider_videos_array
Revises: 20250910_owner_photo_url
Create Date: 2025-09-11 19:42:00
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250911_add_rider_videos_array'
down_revision = '20250910_owner_photo_url'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('videos', sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('videos')

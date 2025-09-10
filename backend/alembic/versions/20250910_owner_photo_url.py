"""
add photo_url to owner_profiles

Revision ID: 20250910_owner_photo_url
Revises: 20250910_owner_guardian_consent
Create Date: 2025-09-10 17:30:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250910_owner_photo_url'
down_revision = '20250910_owner_guardian_consent'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.add_column(sa.Column('photo_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.drop_column('photo_url')

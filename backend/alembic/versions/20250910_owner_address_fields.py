"""
add owner address fields (street, addition, country, lat/lon, confidence)

Revision ID: 20250910_owner_address_fields
Revises: 20250909_add_horse_ad_types
Create Date: 2025-09-10 16:26:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250910_owner_address_fields'
down_revision = '20250909_add_horse_ad_types'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.add_column(sa.Column('street', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('house_number_addition', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('country_code', sa.String(length=2), nullable=True))
        batch_op.add_column(sa.Column('lat', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('lon', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('geocode_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('needs_review', sa.Boolean(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.drop_column('needs_review')
        batch_op.drop_column('geocode_confidence')
        batch_op.drop_column('lon')
        batch_op.drop_column('lat')
        batch_op.drop_column('country_code')
        batch_op.drop_column('house_number_addition')
        batch_op.drop_column('street')

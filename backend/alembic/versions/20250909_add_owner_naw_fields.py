"""
add owner naw fields

Revision ID: 20250909_add_owner_naw_fields
Revises: 20250909_add_desired_horse_and_rider_body
Create Date: 2025-09-09 19:13:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250909_add_owner_naw_fields'
down_revision = '20250909_add_desired_horse_and_rider_body'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.add_column(sa.Column('house_number', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('date_of_birth', sa.Date(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.drop_column('date_of_birth')
        batch_op.drop_column('city')
        batch_op.drop_column('house_number')

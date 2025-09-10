"""
add guardian consent fields to owner_profiles

Revision ID: 20250910_owner_guardian_consent
Revises: 20250910_owner_address_fields
Create Date: 2025-09-10 17:02:30.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '20250910_owner_guardian_consent'
down_revision = '20250910_owner_address_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.add_column(sa.Column('parent_consent', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('parent_name', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('parent_email', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('parent_consent_timestamp', sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('owner_profiles') as batch_op:
        batch_op.drop_column('parent_consent_timestamp')
        batch_op.drop_column('parent_email')
        batch_op.drop_column('parent_name')
        batch_op.drop_column('parent_consent')

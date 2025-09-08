"""
Add fields to rider_profiles: date_of_birth, house_number, city, session_duration_min, session_duration_max

Revision ID: 20250908_add_fields
Revises: 
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250908_add_fields'
down_revision = '0628c1c9f3e7'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.add_column(sa.Column('date_of_birth', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('house_number', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('session_duration_min', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('session_duration_max', sa.Integer(), nullable=True))


def downgrade():
    with op.batch_alter_table('rider_profiles') as batch_op:
        batch_op.drop_column('session_duration_max')
        batch_op.drop_column('session_duration_min')
        batch_op.drop_column('city')
        batch_op.drop_column('house_number')
        batch_op.drop_column('date_of_birth')

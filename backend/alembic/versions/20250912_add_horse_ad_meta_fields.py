"""
add horse ad meta fields: ad_reason, start_date, end_date, no_end_date

Revision ID: 20250912_add_horse_ad_meta_fields
Revises: 
Create Date: 2025-09-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import expression

# revision identifiers, used by Alembic.
revision = '20250912_add_horse_ad_meta_fields'
down_revision = 'ab7c4361afc8'
branch_labels = None
depends_on = None


def upgrade():
    # Table name according to models: horse_profiles
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.add_column(sa.Column('ad_reason', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('start_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('end_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('no_end_date', sa.Boolean(), server_default=expression.false(), nullable=False))


def downgrade():
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.drop_column('no_end_date')
        batch_op.drop_column('end_date')
        batch_op.drop_column('start_date')
        batch_op.drop_column('ad_reason')

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250910_add_horse_stable_address'
down_revision = '20250909_extend_horse_profile_ad_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.add_column(sa.Column('stable_country_code', sa.String(length=2), nullable=True))
        batch_op.add_column(sa.Column('stable_postcode', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('stable_house_number', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('stable_house_number_addition', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('stable_street', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('stable_city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('stable_lat', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('stable_lon', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('stable_geocode_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('stable_needs_review', sa.Boolean(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.drop_column('stable_needs_review')
        batch_op.drop_column('stable_geocode_confidence')
        batch_op.drop_column('stable_lon')
        batch_op.drop_column('stable_lat')
        batch_op.drop_column('stable_city')
        batch_op.drop_column('stable_street')
        batch_op.drop_column('stable_house_number_addition')
        batch_op.drop_column('stable_house_number')
        batch_op.drop_column('stable_postcode')
        batch_op.drop_column('stable_country_code')

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250910_add_horse_facilities_flags'
down_revision = '62031394684e'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.add_column(sa.Column('horse_walker', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('toilet_available', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('locker_available', sa.Boolean(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.drop_column('locker_available')
        batch_op.drop_column('toilet_available')
        batch_op.drop_column('horse_walker')

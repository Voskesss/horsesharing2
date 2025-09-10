from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250910_add_horse_videos_array'
down_revision = '20250910_add_horse_facilities_flags'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.add_column(sa.Column('videos', sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('horse_profiles') as batch_op:
        batch_op.drop_column('videos')

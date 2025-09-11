"""
merge heads (rider_videos + horse_videos_array)

Revision ID: 62031394684f
Revises: 20250910_add_horse_videos_array, 20250911_add_rider_videos_array
Create Date: 2025-09-11 21:51:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '62031394684f'
down_revision: Union[str, Sequence[str], None] = (
    '20250910_add_horse_videos_array',
    '20250911_add_rider_videos_array',
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

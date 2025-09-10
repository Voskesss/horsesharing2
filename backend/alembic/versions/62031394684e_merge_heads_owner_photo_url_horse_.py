"""merge heads (owner_photo_url + horse_stable_address)

Revision ID: 62031394684e
Revises: 20250910_owner_photo_url, 20250910_add_horse_stable_address
Create Date: 2025-09-10 21:29:12.051665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62031394684e'
down_revision: Union[str, Sequence[str], None] = ('20250910_owner_photo_url', '20250910_add_horse_stable_address')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

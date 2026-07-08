"""add image_data column to chat_messages

Revision ID: e5b8f3a1c2d6
Revises: d4a7e2f6c1b3
Create Date: 2026-07-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e5b8f3a1c2d6'
down_revision: Union[str, None] = 'd4a7e2f6c1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('chat_messages', sa.Column('image_data', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_messages', 'image_data')

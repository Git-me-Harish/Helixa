"""add rag_grounding column to chat_messages

Revision ID: d4a7e2f6c1b3
Revises: c3f1d8a2e5b9
Create Date: 2026-07-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd4a7e2f6c1b3'
down_revision: Union[str, None] = 'c3f1d8a2e5b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('chat_messages', sa.Column('rag_grounding', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_messages', 'rag_grounding')
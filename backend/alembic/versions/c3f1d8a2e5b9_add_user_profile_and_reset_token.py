"""add blood_group, gender, address, reset_token columns to users

Revision ID: c3f1d8a2e5b9
Revises: b2f8c1d4e9a7
Create Date: 2026-07-05 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3f1d8a2e5b9'
down_revision: Union[str, None] = 'b2f8c1d4e9a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('blood_group', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('gender', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('reset_token', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_users_reset_token', 'users', ['reset_token'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_reset_token', table_name='users')
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'address')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'blood_group')

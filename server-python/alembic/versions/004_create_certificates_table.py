"""Create certificates table

Revision ID: 004_create_certificates_table
Revises: 003_add_sheets_sync_queue
Create Date: 2026-06-21 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_create_certificates_table'
down_revision: Union[str, None] = '003_add_sheets_sync_queue'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'certificates',
        sa.Column('certificate_id', sa.String(length=60), nullable=False),
        sa.Column('student_id', sa.String(length=255), nullable=False),
        sa.Column('student_name', sa.String(length=200), nullable=False),
        sa.Column('event_id', sa.String(length=255), nullable=False),
        sa.Column('event_name', sa.String(length=300), nullable=False),
        sa.Column('issue_date', sa.String(length=100), nullable=False),
        sa.Column('verification_url', sa.String(length=500), nullable=False),
        sa.Column('template_style', sa.String(length=50), nullable=False, server_default='default'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='valid'),
        sa.PrimaryKeyConstraint('certificate_id'),
        sa.UniqueConstraint('student_id', 'event_id', name='uq_student_event_certificate')
    )
    op.create_index('ix_certificates_certificate_id', 'certificates', ['certificate_id'])


def downgrade() -> None:
    op.drop_index('ix_certificates_certificate_id', table_name='certificates')
    op.drop_table('certificates')

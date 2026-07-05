"""extended_records: wellness, vaccinations, family, emergency contacts, insurance, symptoms, soap_notes, treatment_plans

Revision ID: b2f8c1d4e9a7
Revises: 44db56607beb
Create Date: 2026-07-05 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b2f8c1d4e9a7'
down_revision: Union[str, None] = '44db56607beb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Wellness entries
    op.create_table('wellness_entries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('category', sa.Enum('fitness', 'sleep', 'hydration', 'nutrition', 'stress', 'meditation', name='wellness_category'), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_wellness_entries_patient_id', 'wellness_entries', ['patient_id'])
    op.create_index('ix_wellness_entries_category', 'wellness_entries', ['category'])
    op.create_index('ix_wellness_entries_logged_at', 'wellness_entries', ['logged_at'])

    # Vaccinations
    op.create_table('vaccinations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('vaccine_name', sa.String(length=200), nullable=False),
        sa.Column('dose_number', sa.Integer(), nullable=True),
        sa.Column('total_doses', sa.Integer(), nullable=True),
        sa.Column('administered_date', sa.Date(), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=True),
        sa.Column('administered_by', sa.String(length=200), nullable=True),
        sa.Column('lot_number', sa.String(length=100), nullable=True),
        sa.Column('site', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('completed', 'due', 'overdue', 'not_required', name='vaccination_status'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_vaccinations_patient_id', 'vaccinations', ['patient_id'])

    # Family members
    op.create_table('family_members',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('relationship', sa.String(length=100), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('medical_conditions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('allergies', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('medications', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_family_members_patient_id', 'family_members', ['patient_id'])

    # Emergency contacts
    op.create_table('emergency_contacts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('relationship', sa.String(length=100), nullable=False),
        sa.Column('phone_primary', sa.String(length=30), nullable=False),
        sa.Column('phone_secondary', sa.String(length=30), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_emergency_contacts_patient_id', 'emergency_contacts', ['patient_id'])

    # Insurance policies
    op.create_table('insurance_policies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('insurance_type', sa.Enum('primary', 'secondary', 'dental', 'vision', 'life', name='insurance_type'), nullable=False),
        sa.Column('provider_name', sa.String(length=200), nullable=False),
        sa.Column('policy_number', sa.String(length=100), nullable=False),
        sa.Column('group_number', sa.String(length=100), nullable=True),
        sa.Column('member_id', sa.String(length=100), nullable=True),
        sa.Column('subscriber_name', sa.String(length=200), nullable=True),
        sa.Column('subscriber_relationship', sa.String(length=100), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('copay', sa.Float(), nullable=True),
        sa.Column('deductible', sa.Float(), nullable=True),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_insurance_policies_patient_id', 'insurance_policies', ['patient_id'])

    # Symptom logs
    op.create_table('symptom_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('symptom', sa.String(length=300), nullable=False),
        sa.Column('severity', sa.Integer(), nullable=False),
        sa.Column('duration', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('triggers', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('relieving_factors', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('associated_symptoms', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_symptom_logs_patient_id', 'symptom_logs', ['patient_id'])
    op.create_index('ix_symptom_logs_logged_at', 'symptom_logs', ['logged_at'])

    # SOAP notes
    op.create_table('soap_notes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('visit_date', sa.Date(), nullable=False),
        sa.Column('provider_name', sa.String(length=200), nullable=True),
        sa.Column('chief_complaint', sa.Text(), nullable=True),
        sa.Column('subjective', sa.Text(), nullable=True),
        sa.Column('objective', sa.Text(), nullable=True),
        sa.Column('assessment', sa.Text(), nullable=True),
        sa.Column('plan', sa.Text(), nullable=True),
        sa.Column('icd10_codes', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('follow_up_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_soap_notes_patient_id', 'soap_notes', ['patient_id'])
    op.create_index('ix_soap_notes_visit_date', 'soap_notes', ['visit_date'])

    # Treatment plans
    op.create_table('treatment_plans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('condition', sa.String(length=300), nullable=False),
        sa.Column('prescribing_provider', sa.String(length=200), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('active', 'completed', 'paused', 'discontinued', name='treatment_status'), nullable=False),
        sa.Column('goals', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('interventions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('medications', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('progress_notes', sa.Text(), nullable=True),
        sa.Column('next_review_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_treatment_plans_patient_id', 'treatment_plans', ['patient_id'])


def downgrade() -> None:
    op.drop_table('treatment_plans')
    op.drop_table('soap_notes')
    op.drop_table('symptom_logs')
    op.drop_table('insurance_policies')
    op.drop_table('emergency_contacts')
    op.drop_table('family_members')
    op.drop_table('vaccinations')
    op.drop_table('wellness_entries')
    op.execute("DROP TYPE IF EXISTS wellness_category")
    op.execute("DROP TYPE IF EXISTS vaccination_status")
    op.execute("DROP TYPE IF EXISTS insurance_type")
    op.execute("DROP TYPE IF EXISTS treatment_status")

/**
 * 1801_create-compliance-audit-tables.js
 * Compliance & Accessibility Audit Tools (#1801)
 *
 * Creates tables for:
 * - audit_runs
 * - audit_issues
 * - audit_remediations
 * - audit_trends
 * - audit_exports
 *
 * Notes:
 * - JSONB fields store engine-specific evidence.
 * - This is DB-backed when Supabase/Postgres is configured.
 */

export async function up({ client }) {
  await client.query(`
    create extension if not exists pgcrypto;

    create table if not exists audit_runs (
      id uuid primary key default gen_random_uuid(),
      run_type varchar(100) not null, -- wcag | gdpr | pci | weekly
      created_by_admin_id varchar(255),
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      status varchar(30) not null default 'running', -- running | completed | failed
      target_scope jsonb not null default '{}'::jsonb, -- urls scanned, domains checked, etc.
      metadata jsonb not null default '{}'::jsonb,
      summary jsonb not null default '{}'::jsonb
    );

    create index if not exists idx_audit_runs_created_by_admin_id on audit_runs (created_by_admin_id);
    create index if not exists idx_audit_runs_run_type on audit_runs (run_type);
    create index if not exists idx_audit_runs_started_at on audit_runs (started_at desc);

    create table if not exists audit_issues (
      id uuid primary key default gen_random_uuid(),
      run_id uuid not null references audit_runs(id) on delete cascade,
      issue_type varchar(100) not null, -- wcag_color_contrast, wcag_alt_text, gdpr_retention, pci_ssl, etc.
      severity varchar(20) not null, -- Critical | Serious | Minor
      title text not null,
      description text not null default '',
      page_url text,
      selector text,
      evidence jsonb not null default '{}'::jsonb,
      recommended_fix text not null default '',
      suggested_fix_json jsonb not null default '{}'::jsonb,
      fingerprint text not null, -- stable hash for deduping across runs
      created_at timestamptz not null default now()
    );

    create index if not exists idx_audit_issues_run_id on audit_issues (run_id);
    create index if not exists idx_audit_issues_severity on audit_issues (severity);
    create index if not exists idx_audit_issues_issue_type on audit_issues (issue_type);
    create unique index if not exists uq_audit_issues_run_fingerprint on audit_issues (run_id, fingerprint);

    create table if not exists audit_remediations (
      id uuid primary key default gen_random_uuid(),
      issue_id uuid not null references audit_issues(id) on delete cascade,
      assigned_to varchar(255),
      remediation_status varchar(30) not null default 'open', -- open | in_progress | done | wont_fix
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deadline timestamptz,
      notes text,
      completed_at timestamptz,
      re_audit_required boolean not null default true,
      audit_notes jsonb not null default '{}'::jsonb
    );

    create index if not exists idx_audit_remediations_assigned_to on audit_remediations (assigned_to);
    create index if not exists idx_audit_remediations_status on audit_remediations (remediation_status);
    create index if not exists idx_audit_remediations_deadline on audit_remediations (deadline);

    create table if not exists audit_trends (
      id uuid primary key default gen_random_uuid(),
      run_type varchar(100) not null,
      week_start timestamptz not null,
      snapshot jsonb not null default '{}'::jsonb, -- aggregates by severity/type
      created_at timestamptz not null default now(),
      unique (run_type, week_start)
    );

    create table if not exists audit_exports (
      id uuid primary key default gen_random_uuid(),
      run_id uuid references audit_runs(id) on delete set null,
      export_type varchar(50) not null default 'auditor',
      created_by_admin_id varchar(255),
      created_at timestamptz not null default now(),
      payload jsonb not null default '{}'::jsonb, -- JSON report snapshot for auditors
      format varchar(20) not null default 'json', -- json | csv
      filename text
    );

    create index if not exists idx_audit_exports_created_by_admin_id on audit_exports (created_by_admin_id);
    create index if not exists idx_audit_exports_created_at on audit_exports (created_at desc);
  `);
}

export async function down({ client }) {
  await client.query(`
    drop table if exists audit_exports;
    drop table if exists audit_trends;
    drop table if exists audit_remediations;
    drop table if exists audit_issues;
    drop table if exists audit_runs;
  `);
}

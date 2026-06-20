export const up = (pgm) => {
  pgm.sql(`-- Event Budget Management & Financial Tracking Migration
-- Run this migration to add financial tables to the database

-- Event Budgets table
CREATE TABLE IF NOT EXISTS event_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  category_allocations JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_budgets_event_id ON event_budgets (event_id);
CREATE INDEX IF NOT EXISTS idx_event_budgets_created_at ON event_budgets (created_at DESC);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES event_budgets(id) ON DELETE CASCADE,
  event_id TEXT,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'Misc',
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses (budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses (status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);

-- Revenue Entries table
CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES event_budgets(id) ON DELETE CASCADE,
  event_id TEXT,
  source TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_budget_id ON revenue_entries (budget_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_source ON revenue_entries (source);

-- Financial Audit Trail table
CREATE TABLE IF NOT EXISTS financial_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id TEXT,
  changes JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_audit_record ON financial_audit_trail (record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_user ON financial_audit_trail (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_created_at ON financial_audit_trail (created_at DESC);
`);
};

export const down = (_pgm) => {
  // down migration not implemented
};

/* Migration: Create Financial Management Tables
   Description: Database schema for tracking budgets, expenses, revenues, and audit trails
   Version: 1.0.0
   Date: 2026-06-18
*/

export const up = (pgm) => {
  // 1. event_budgets table
  pgm.createTable('event_budgets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_id: {
      type: 'text',
      references: 'events',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'text',
      notNull: true,
    },
    total_amount: {
      type: 'numeric',
      notNull: true,
      default: 0,
    },
    start_date: {
      type: 'timestamptz',
    },
    end_date: {
      type: 'timestamptz',
    },
    category_allocations: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    created_by: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('event_budgets', 'event_id', { name: 'idx_event_budgets_event_id' });

  // 2. expenses table
  pgm.createTable('expenses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    budget_id: {
      type: 'uuid',
      references: 'event_budgets',
      onDelete: 'CASCADE',
    },
    event_id: {
      type: 'text',
      references: 'events',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'text',
      notNull: true,
    },
    amount: {
      type: 'numeric',
      notNull: true,
    },
    category: {
      type: 'text',
      notNull: true, // Venue, Food & Drinks, Equipment, Marketing, Speaker Fees, Prizes, Misc
    },
    receipt_url: {
      type: 'text',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'submitted', // submitted, reviewed, approved, reimbursed
    },
    submitted_by: {
      type: 'text',
      notNull: true,
    },
    approved_by: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('expenses', 'budget_id', { name: 'idx_expenses_budget_id' });
  pgm.createIndex('expenses', 'event_id', { name: 'idx_expenses_event_id' });

  // 3. revenue_entries table
  pgm.createTable('revenue_entries', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    budget_id: {
      type: 'uuid',
      references: 'event_budgets',
      onDelete: 'CASCADE',
    },
    event_id: {
      type: 'text',
      references: 'events',
      onDelete: 'CASCADE',
    },
    source: {
      type: 'text',
      notNull: true, // Ticket Sales, Sponsorship, Donation, Merchandise
    },
    amount: {
      type: 'numeric',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    received_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    created_by: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('revenue_entries', 'budget_id', { name: 'idx_revenue_entries_budget_id' });
  pgm.createIndex('revenue_entries', 'event_id', { name: 'idx_revenue_entries_event_id' });

  // 4. financial_audit_trail table
  pgm.createTable('financial_audit_trail', {
    id: {
      type: 'uuid',
      primaryKey: true,
      notNull: true,
      default: pgm.func('gen_random_uuid()'),
    },
    action: {
      type: 'text',
      notNull: true, // CREATE_BUDGET, UPDATE_BUDGET, DELETE_BUDGET, CREATE_EXPENSE, UPDATE_EXPENSE, APPROVE_EXPENSE, CREATE_REVENUE
    },
    record_type: {
      type: 'text',
      notNull: true, // budget, expense, revenue
    },
    record_id: {
      type: 'text',
      notNull: true,
    },
    user_id: {
      type: 'text',
      notNull: true,
    },
    changes: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('financial_audit_trail', ['record_type', 'record_id'], {
    name: 'idx_financial_audit_record',
  });
};

export const down = (pgm) => {
  pgm.dropTable('financial_audit_trail', { ifExists: true, cascade: true });
  pgm.dropTable('revenue_entries', { ifExists: true, cascade: true });
  pgm.dropTable('expenses', { ifExists: true, cascade: true });
  pgm.dropTable('event_budgets', { ifExists: true, cascade: true });
};

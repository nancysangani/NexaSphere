import { withDb } from './db.js';

function mapBudgetRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    totalAmount: Number(row.total_amount),
    startDate: row.start_date,
    endDate: row.end_date,
    categoryAllocations:
      typeof row.category_allocations === 'string'
        ? JSON.parse(row.category_allocations)
        : (row.category_allocations ?? {}),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpenseRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    budgetId: row.budget_id,
    eventId: row.event_id,
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    receiptUrl: row.receipt_url,
    status: row.status,
    submittedBy: row.submitted_by,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRevenueRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    budgetId: row.budget_id,
    eventId: row.event_id,
    source: row.source,
    amount: Number(row.amount),
    description: row.description,
    receivedAt: row.received_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    action: row.action,
    recordType: row.record_type,
    recordId: row.record_id,
    userId: row.user_id,
    changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : (row.changes ?? {}),
    createdAt: row.created_at,
  };
}

export const financialRepository = {
  // --- Budgets ---
  async createBudget(budget) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO event_budgets (event_id, name, total_amount, start_date, end_date, category_allocations, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          budget.eventId || null,
          budget.name,
          budget.totalAmount || 0,
          budget.startDate || null,
          budget.endDate || null,
          JSON.stringify(budget.categoryAllocations || {}),
          budget.createdBy,
        ]
      );
      return mapBudgetRow(rows[0]);
    });
  },

  async getBudgetById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM event_budgets WHERE id = $1', [id]);
      if (!rows.length) return null;
      return mapBudgetRow(rows[0]);
    });
  },

  async getBudgetByEventId(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM event_budgets WHERE event_id = $1', [
        eventId,
      ]);
      if (!rows.length) return null;
      return mapBudgetRow(rows[0]);
    });
  },

  async getBudgets() {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM event_budgets ORDER BY created_at DESC');
      return rows.map(mapBudgetRow);
    });
  },

  async updateBudget(id, patch) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_budgets SET
           name = COALESCE($2, name),
           total_amount = COALESCE($3, total_amount),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           category_allocations = COALESCE($6, category_allocations),
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.name ?? null,
          patch.totalAmount !== undefined ? patch.totalAmount : null,
          patch.startDate ?? null,
          patch.endDate ?? null,
          patch.categoryAllocations ? JSON.stringify(patch.categoryAllocations) : null,
        ]
      );
      if (!rows.length) return null;
      return mapBudgetRow(rows[0]);
    });
  },

  async deleteBudget(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('DELETE FROM event_budgets WHERE id = $1', [id]);
      return rowCount > 0;
    });
  },

  // --- Expenses ---
  async createExpense(expense) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO expenses (budget_id, event_id, name, amount, category, receipt_url, status, submitted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          expense.budgetId || null,
          expense.eventId || null,
          expense.name,
          expense.amount,
          expense.category,
          expense.receiptUrl || null,
          expense.status || 'submitted',
          expense.submittedBy,
        ]
      );
      return mapExpenseRow(rows[0]);
    });
  },

  async getExpenseById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM expenses WHERE id = $1', [id]);
      if (!rows.length) return null;
      return mapExpenseRow(rows[0]);
    });
  },

  async getExpensesByBudgetId(budgetId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM expenses WHERE budget_id = $1 ORDER BY created_at DESC',
        [budgetId]
      );
      return rows.map(mapExpenseRow);
    });
  },

  async getExpensesByEventId(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM expenses WHERE event_id = $1 ORDER BY created_at DESC',
        [eventId]
      );
      return rows.map(mapExpenseRow);
    });
  },

  async updateExpense(id, patch) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE expenses SET
           name = COALESCE($2, name),
           amount = COALESCE($3, amount),
           category = COALESCE($4, category),
           receipt_url = COALESCE($5, receipt_url),
           status = COALESCE($6, status),
           approved_by = COALESCE($7, approved_by),
           updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.name ?? null,
          patch.amount !== undefined ? patch.amount : null,
          patch.category ?? null,
          patch.receiptUrl ?? null,
          patch.status ?? null,
          patch.approvedBy ?? null,
        ]
      );
      if (!rows.length) return null;
      return mapExpenseRow(rows[0]);
    });
  },

  async deleteExpense(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('DELETE FROM expenses WHERE id = $1', [id]);
      return rowCount > 0;
    });
  },

  // --- Revenue ---
  async createRevenue(revenue) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO revenue_entries (budget_id, event_id, source, amount, description, received_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          revenue.budgetId || null,
          revenue.eventId || null,
          revenue.source,
          revenue.amount,
          revenue.description || null,
          revenue.receivedAt || new Date(),
          revenue.createdBy,
        ]
      );
      return mapRevenueRow(rows[0]);
    });
  },

  async getRevenueById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM revenue_entries WHERE id = $1', [id]);
      if (!rows.length) return null;
      return mapRevenueRow(rows[0]);
    });
  },

  async getRevenuesByBudgetId(budgetId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM revenue_entries WHERE budget_id = $1 ORDER BY received_at DESC',
        [budgetId]
      );
      return rows.map(mapRevenueRow);
    });
  },

  async getRevenuesByEventId(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM revenue_entries WHERE event_id = $1 ORDER BY received_at DESC',
        [eventId]
      );
      return rows.map(mapRevenueRow);
    });
  },

  async deleteRevenue(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query('DELETE FROM revenue_entries WHERE id = $1', [id]);
      return rowCount > 0;
    });
  },

  // --- Audit Trail ---
  async insertAuditLog(log) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO financial_audit_trail (action, record_type, record_id, user_id, changes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [log.action, log.recordType, log.recordId, log.userId, JSON.stringify(log.changes || {})]
      );
      return mapAuditRow(rows[0]);
    });
  },

  async getAuditLogs(recordType = null, recordId = null) {
    return withDb(async (client) => {
      let query = 'SELECT * FROM financial_audit_trail';
      const params = [];
      if (recordType && recordId) {
        query += ' WHERE record_type = $1 AND record_id = $2';
        params.push(recordType, recordId);
      } else if (recordType) {
        query += ' WHERE record_type = $1';
        params.push(recordType);
      }
      query += ' ORDER BY created_at DESC';
      const { rows } = await client.query(query, params);
      return rows.map(mapAuditRow);
    });
  },
};

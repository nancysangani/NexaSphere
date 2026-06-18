/**
 * Financial Management System — Test Suite
 * Tests for budgets, expenses, revenues, reports, alerts, permissions, and API endpoints.
 */

// ─── ENV MUST BE FIRST (before any imports that check env at evaluation time) ───
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.ADMIN_EVENT_PASSWORD = 'StrongEventPassword123!';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit';
process.env.PORT = '0';

import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import http from 'node:http';
import { setWithDbOverride } from '../repositories/db.js';
import { financialService } from '../services/financialService.js';

// NOTE: studentAuthService is dynamically imported inside the integration test
// because it throws if JWT_SECRET is absent at module evaluation time.

// ─── Mock DB State ────────────────────────────────────────────────────────────
let executedQueries = [];
let mockDbResult = {
  selectBudgets: [],
  selectExpenses: [],
  selectRevenues: [],
  selectAuditTrail: [],
  insertBudgetResult: null,
  insertExpenseResult: null,
  insertRevenueResult: null,
};

function resetMock() {
  executedQueries = [];
  mockDbResult = {
    selectBudgets: [],
    selectExpenses: [],
    selectRevenues: [],
    selectAuditTrail: [],
    insertBudgetResult: null,
    insertExpenseResult: null,
    insertRevenueResult: null,
  };
}

setWithDbOverride(async (fn) => {
  const mockClient = {
    query: async (sql, params) => {
      executedQueries.push({ sql: sql.trim().replace(/\s+/g, ' '), params });
      const sqlLower = sql.toLowerCase();

      if (sqlLower.includes('insert into event_budgets')) {
        return {
          rows: mockDbResult.insertBudgetResult ? [mockDbResult.insertBudgetResult] : [],
          rowCount: 1,
        };
      }
      if (sqlLower.includes('insert into expenses')) {
        return {
          rows: mockDbResult.insertExpenseResult ? [mockDbResult.insertExpenseResult] : [],
          rowCount: 1,
        };
      }
      if (sqlLower.includes('insert into revenue_entries')) {
        return {
          rows: mockDbResult.insertRevenueResult ? [mockDbResult.insertRevenueResult] : [],
          rowCount: 1,
        };
      }
      if (sqlLower.includes('insert into financial_audit_trail')) {
        return { rows: [], rowCount: 1 };
      }
      if (sqlLower.includes('from event_budgets')) {
        if (params && params.length > 0) {
          const id = params[0];
          const budget = mockDbResult.selectBudgets.find((b) => b.id === id || b.event_id === id);
          return { rows: budget ? [budget] : [], rowCount: budget ? 1 : 0 };
        }
        return { rows: mockDbResult.selectBudgets, rowCount: mockDbResult.selectBudgets.length };
      }
      if (sqlLower.includes('from expenses')) {
        if (params && params.length > 0) {
          const id = params[0];
          if (sqlLower.includes('where id = $1')) {
            const expense = mockDbResult.selectExpenses.find((e) => e.id === id);
            return { rows: expense ? [expense] : [], rowCount: expense ? 1 : 0 };
          }
          const filtered = mockDbResult.selectExpenses.filter(
            (e) => e.budget_id === id || e.event_id === id
          );
          return { rows: filtered, rowCount: filtered.length };
        }
        return { rows: mockDbResult.selectExpenses, rowCount: mockDbResult.selectExpenses.length };
      }
      if (sqlLower.includes('from revenue_entries')) {
        if (params && params.length > 0) {
          const id = params[0];
          if (sqlLower.includes('where id = $1')) {
            const rev = mockDbResult.selectRevenues.find((r) => r.id === id);
            return { rows: rev ? [rev] : [], rowCount: rev ? 1 : 0 };
          }
          const filtered = mockDbResult.selectRevenues.filter(
            (r) => r.budget_id === id || r.event_id === id
          );
          return { rows: filtered, rowCount: filtered.length };
        }
        return { rows: mockDbResult.selectRevenues, rowCount: mockDbResult.selectRevenues.length };
      }
      if (sqlLower.includes('from financial_audit_trail')) {
        return {
          rows: mockDbResult.selectAuditTrail,
          rowCount: mockDbResult.selectAuditTrail.length,
        };
      }
      if (sqlLower.includes('update event_budgets') || sqlLower.includes('update expenses')) {
        return { rows: params && params[0] ? [{ id: params[0] }] : [], rowCount: 1 };
      }
      if (sqlLower.includes('delete')) {
        return { rows: [], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    },
  };
  return fn(mockClient);
});

// ─── Test Users ───────────────────────────────────────────────────────────────
const mockAdminUser = { id: 'usr_admin', role: 'admin', full_name: 'Admin User' };
const mockTreasurerUser = { id: 'usr_treasurer', role: 'treasurer', full_name: 'Treasurer User' };
const mockOrganizerUser = { id: 'usr_organizer', role: 'organizer', full_name: 'Organizer User' };
const mockStudentUser = { id: 'usr_student', role: 'student', full_name: 'Regular Student' };

beforeEach(() => {
  resetMock();
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

test('Budget creation and permission checks', async () => {
  const budgetData = {
    eventId: 'evt_1',
    name: 'Hackathon 2026',
    totalAmount: 5000,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    categoryAllocations: { Food: 2000, Venue: 2000, Marketing: 1000 },
  };

  mockDbResult.insertBudgetResult = {
    id: 'b_1',
    event_id: 'evt_1',
    name: 'Hackathon 2026',
    total_amount: '5000',
    start_date: budgetData.startDate,
    end_date: budgetData.endDate,
    category_allocations: JSON.stringify(budgetData.categoryAllocations),
    created_by: 'usr_admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Admin can create budget
  const b = await financialService.createBudget(budgetData, mockAdminUser);
  assert.equal(b.id, 'b_1');
  assert.equal(b.totalAmount, 5000);
  assert.equal(b.categoryAllocations.Food, 2000);

  // Regular student is forbidden
  await assert.rejects(
    () => financialService.createBudget(budgetData, mockStudentUser),
    /Forbidden/
  );
});

test('Budget clone from past event', async () => {
  const existingBudget = {
    id: 'b_1',
    event_id: 'evt_1',
    name: 'Hackathon 2026',
    total_amount: '5000',
    category_allocations: JSON.stringify({ Food: 2000, Venue: 3000 }),
    created_by: 'usr_admin',
  };
  mockDbResult.selectBudgets = [existingBudget];
  mockDbResult.insertBudgetResult = {
    ...existingBudget,
    id: 'b_cloned',
    name: 'Hackathon 2026 (Cloned)',
    event_id: 'evt_cloned',
    created_by: 'usr_organizer',
  };

  const cloned = await financialService.cloneBudget('b_1', 'evt_cloned', mockOrganizerUser);
  assert.equal(cloned.id, 'b_cloned');
  assert.ok(cloned.name.includes('Cloned'));
});

test('Expense tracking and approval workflow', async () => {
  const expenseData = {
    budgetId: 'b_1',
    eventId: 'evt_1',
    name: 'Pizza Delivery',
    amount: 350,
    category: 'Food',
    receiptUrl: 'https://receipts.com/r_1.pdf',
  };

  mockDbResult.insertExpenseResult = {
    id: 'exp_1',
    budget_id: 'b_1',
    event_id: 'evt_1',
    name: 'Pizza Delivery',
    amount: '350',
    category: 'Food',
    receipt_url: 'https://receipts.com/r_1.pdf',
    status: 'submitted',
    submitted_by: 'usr_organizer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Budget needed for alert check triggered inside createExpense
  mockDbResult.selectBudgets = [
    {
      id: 'b_1',
      name: 'Test Budget',
      total_amount: '5000',
      category_allocations: '{}',
      created_by: 'usr_admin',
    },
  ];

  const exp = await financialService.createExpense(expenseData, mockOrganizerUser);
  assert.equal(exp.id, 'exp_1');
  assert.equal(exp.status, 'submitted');

  // Organizer cannot approve
  mockDbResult.selectExpenses = [mockDbResult.insertExpenseResult];
  await assert.rejects(
    () => financialService.updateExpense('exp_1', { status: 'approved' }, mockOrganizerUser),
    /Only admins or treasurers/
  );

  // Treasurer CAN approve
  const approved = await financialService.updateExpense(
    'exp_1',
    { status: 'approved' },
    mockTreasurerUser
  );
  assert.ok(approved);
});

test('Budget vs Actual variance calculations and limit alerts', async () => {
  mockDbResult.selectBudgets = [
    {
      id: 'b_1',
      name: 'Budget 1',
      total_amount: '1000',
      category_allocations: JSON.stringify({ Food: 600, Venue: 400 }),
      created_by: 'usr_admin',
    },
  ];

  mockDbResult.selectExpenses = [
    {
      id: 'exp_1',
      budget_id: 'b_1',
      amount: '500',
      category: 'Food',
      status: 'approved',
      submitted_by: 'usr_admin',
    },
    {
      id: 'exp_2',
      budget_id: 'b_1',
      amount: '350',
      category: 'Venue',
      status: 'approved',
      submitted_by: 'usr_admin',
    },
    {
      id: 'exp_3',
      budget_id: 'b_1',
      amount: '50',
      category: 'Food',
      status: 'submitted',
      submitted_by: 'usr_admin',
    },
  ];

  const variance = await financialService.getBudgetVariance('b_1', mockAdminUser);

  // exp_3 is only 'submitted' → excluded from actual spend
  assert.equal(variance.totalBudgeted, 1000);
  assert.equal(variance.totalActual, 850); // 500 + 350
  assert.equal(variance.totalVariance, 150); // 1000 - 850

  // 85% utilization → '80%' alert level
  assert.ok(variance.alert);
  assert.equal(variance.alert.alertLevel, '80%');

  const foodComp = variance.comparisons.find((c) => c.category === 'Food');
  assert.equal(foodComp.budgeted, 600);
  assert.equal(foodComp.actual, 500);
  assert.equal(foodComp.status, 'under_budget');
});

test('Income statement report generation', async () => {
  mockDbResult.selectBudgets = [
    {
      id: 'b_1',
      name: 'Event Budget',
      total_amount: '1000',
      category_allocations: '{}',
      created_by: 'usr_admin',
    },
  ];
  mockDbResult.selectRevenues = [
    {
      id: 'rev_1',
      budget_id: 'b_1',
      source: 'Ticket Sales',
      amount: '1200',
      received_at: new Date().toISOString(),
      created_by: 'usr_admin',
    },
  ];
  mockDbResult.selectExpenses = [
    {
      id: 'exp_1',
      budget_id: 'b_1',
      amount: '800',
      category: 'Venue',
      status: 'approved',
      submitted_by: 'usr_admin',
      created_at: new Date().toISOString(),
    },
  ];

  const statement = await financialService.getIncomeStatement('b_1', mockAdminUser);
  assert.equal(statement.totalRevenue, 1200);
  assert.equal(statement.totalExpenses, 800);
  assert.equal(statement.netProfitOrLoss, 400);
  assert.equal(statement.statementType, 'Profit');
});

test('Cash flow statement with running balance', async () => {
  mockDbResult.selectBudgets = [
    {
      id: 'b_1',
      name: 'Event Budget',
      total_amount: '1000',
      category_allocations: '{}',
      created_by: 'usr_admin',
    },
  ];
  mockDbResult.selectRevenues = [
    {
      id: 'rev_1',
      budget_id: 'b_1',
      source: 'Sponsorship',
      amount: '500',
      received_at: new Date().toISOString(),
      created_by: 'usr_admin',
    },
  ];
  mockDbResult.selectExpenses = [
    {
      id: 'exp_1',
      budget_id: 'b_1',
      amount: '200',
      category: 'Marketing',
      status: 'reimbursed',
      submitted_by: 'usr_admin',
      created_at: new Date().toISOString(),
    },
  ];

  const cashFlow = await financialService.getCashFlowStatement('b_1', mockAdminUser);
  assert.equal(cashFlow.finalBalance, 300); // 500 revenue - 200 expense
  assert.equal(cashFlow.flows.length, 2);
});

test('CSV export report format', async () => {
  mockDbResult.selectBudgets = [
    {
      id: 'b_1',
      name: 'Event Budget',
      total_amount: '1000',
      category_allocations: JSON.stringify({ Food: 500, Venue: 500 }),
      created_by: 'usr_admin',
    },
  ];
  mockDbResult.selectExpenses = [
    {
      id: 'exp_1',
      budget_id: 'b_1',
      amount: '300',
      category: 'Food',
      status: 'approved',
      submitted_by: 'usr_admin',
    },
  ];

  const csv = await financialService.exportReport('b_1', 'csv', mockAdminUser);
  assert.ok(csv.includes('Category,Budgeted Amount,Actual Amount,Variance,Status'));
  assert.ok(csv.includes('Food'));
  assert.ok(csv.includes('Venue'));
});

// ─── Integration Tests ────────────────────────────────────────────────────────

test('Financial API Endpoints Integration', async (t) => {
  // Dynamic import — studentAuthService validates JWT_SECRET at module load time.
  // By the time this runs, process.env.JWT_SECRET is already set.
  const { studentAuthService } = await import('../services/studentAuthService.js');

  const testToken = studentAuthService.generateToken({
    id: 'usr_admin',
    provider: 'github',
    email: 'admin@nexasphere.com',
    full_name: 'Admin User',
    role: 'admin',
  });

  const { default: app } = await import('../index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const sendRequest = (method, path, body = null, headers = {}) =>
    new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data || '{}');
          } catch (_) {
            parsed = { raw: data };
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });

  await t.test('POST /api/budgets creates a budget', async () => {
    mockDbResult.insertBudgetResult = {
      id: 'b_api_1',
      name: 'API Budget',
      total_amount: '2500',
      category_allocations: '{}',
      created_by: 'usr_admin',
    };

    const res = await sendRequest(
      'POST',
      '/api/budgets',
      { name: 'API Budget', totalAmount: 2500 },
      { Authorization: `Bearer ${testToken}` }
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.id, 'b_api_1');
  });

  await t.test('GET /api/budgets lists budgets', async () => {
    mockDbResult.selectBudgets = [
      {
        id: 'b_api_1',
        name: 'API Budget',
        total_amount: '2500',
        category_allocations: '{}',
        created_by: 'usr_admin',
      },
    ];

    const res = await sendRequest('GET', '/api/budgets', null, {
      Authorization: `Bearer ${testToken}`,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.budgets));
    assert.equal(res.body.budgets[0].id, 'b_api_1');
  });

  await t.test('GET /api/budgets returns 401 without token', async () => {
    const res = await sendRequest('GET', '/api/budgets');
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/expenses creates an expense', async () => {
    mockDbResult.insertExpenseResult = {
      id: 'exp_api_1',
      budget_id: 'b_api_1',
      name: 'Catering',
      amount: '400',
      category: 'Food',
      status: 'submitted',
      submitted_by: 'usr_admin',
    };
    mockDbResult.selectBudgets = [
      {
        id: 'b_api_1',
        name: 'API Budget',
        total_amount: '2500',
        category_allocations: '{}',
        created_by: 'usr_admin',
      },
    ];

    const res = await sendRequest(
      'POST',
      '/api/expenses',
      { budgetId: 'b_api_1', name: 'Catering', amount: 400, category: 'Food' },
      { Authorization: `Bearer ${testToken}` }
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.id, 'exp_api_1');
    assert.equal(res.body.status, 'submitted');
  });

  server.close();
});

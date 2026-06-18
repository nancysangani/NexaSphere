import { financialService } from '../services/financialService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      let status = 500;
      const msg = e.message || '';

      if (msg.includes('Forbidden') || msg.includes('permission')) {
        status = 403;
      } else if (msg.includes('Authentication') || msg.includes('authorized')) {
        status = 401;
      } else if (msg.includes('not found')) {
        status = 404;
      } else if (msg.includes('invalid') || msg.includes('required')) {
        status = 400;
      }

      res.status(status).json({ error: msg || 'Internal server error' });
    });
}

// --- Budgets ---
export const createBudget = wrapAsync(async (req, res) => {
  const { eventId, name, totalAmount, startDate, endDate, categoryAllocations } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Budget name is required' });
  }

  const budget = await financialService.createBudget(
    { eventId, name, totalAmount, startDate, endDate, categoryAllocations },
    req.studentUser
  );
  return res.status(201).json(budget);
});

export const getBudgets = wrapAsync(async (req, res) => {
  const budgets = await financialService.getBudgets(req.studentUser);
  return res.status(200).json({ budgets });
});

export const getBudgetById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const budget = await financialService.getBudgetById(id, req.studentUser);
  return res.status(200).json(budget);
});

export const updateBudget = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await financialService.updateBudget(id, req.body, req.studentUser);
  return res.status(200).json(updated);
});

export const deleteBudget = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const success = await financialService.deleteBudget(id, req.studentUser);
  return res.status(200).json({ success });
});

export const cloneBudget = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { newEventId } = req.body;
  if (!newEventId) {
    return res.status(400).json({ error: 'newEventId is required to clone a budget' });
  }
  const cloned = await financialService.cloneBudget(id, newEventId, req.studentUser);
  return res.status(201).json(cloned);
});

// --- Expenses ---
export const createExpense = wrapAsync(async (req, res) => {
  const { budgetId, eventId, name, amount, category, receiptUrl } = req.body;
  if (!name || amount === undefined || !category) {
    return res.status(400).json({ error: 'Name, amount, and category are required' });
  }

  const expense = await financialService.createExpense(
    { budgetId, eventId, name, amount, category, receiptUrl },
    req.studentUser
  );
  return res.status(201).json(expense);
});

export const getExpenses = wrapAsync(async (req, res) => {
  const { budgetId } = req.query;
  if (!budgetId) {
    return res.status(400).json({ error: 'budgetId is required as query param' });
  }
  const expenses = await financialService.getExpenses(budgetId, req.studentUser);
  return res.status(200).json({ expenses });
});

export const updateExpense = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await financialService.updateExpense(id, req.body, req.studentUser);
  return res.status(200).json(updated);
});

export const deleteExpense = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const success = await financialService.deleteExpense(id, req.studentUser);
  return res.status(200).json({ success });
});

// --- Revenue ---
export const createRevenue = wrapAsync(async (req, res) => {
  const { budgetId, eventId, source, amount, description, receivedAt } = req.body;
  if (!source || amount === undefined) {
    return res.status(400).json({ error: 'Source and amount are required' });
  }

  const revenue = await financialService.createRevenue(
    { budgetId, eventId, source, amount, description, receivedAt },
    req.studentUser
  );
  return res.status(201).json(revenue);
});

export const getRevenues = wrapAsync(async (req, res) => {
  const { budgetId } = req.query;
  if (!budgetId) {
    return res.status(400).json({ error: 'budgetId is required as query param' });
  }
  const revenues = await financialService.getRevenues(budgetId, req.studentUser);
  return res.status(200).json({ revenues });
});

export const deleteRevenue = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const success = await financialService.deleteRevenue(id, req.studentUser);
  return res.status(200).json({ success });
});

// --- Reports & Calculations ---
export const getBudgetVariance = wrapAsync(async (req, res) => {
  const { id } = req.params; // budgetId
  const report = await financialService.getBudgetVariance(id, req.studentUser);
  return res.status(200).json(report);
});

export const getIncomeStatement = wrapAsync(async (req, res) => {
  const { id } = req.params; // budgetId
  const report = await financialService.getIncomeStatement(id, req.studentUser);
  return res.status(200).json(report);
});

export const getCashFlowStatement = wrapAsync(async (req, res) => {
  const { id } = req.params; // budgetId
  const report = await financialService.getCashFlowStatement(id, req.studentUser);
  return res.status(200).json(report);
});

export const getBudgetsUtilizationReport = wrapAsync(async (req, res) => {
  const report = await financialService.getBudgetsUtilizationReport(req.studentUser);
  return res.status(200).json({ budgets: report });
});

export const getYearOverYearComparison = wrapAsync(async (req, res) => {
  const report = await financialService.getYearOverYearComparison(req.studentUser);
  return res.status(200).json({ comparison: report });
});

export const exportReport = wrapAsync(async (req, res) => {
  const { id } = req.params; // budgetId
  const { format = 'csv' } = req.query;

  const result = await financialService.exportReport(id, format, req.studentUser);

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=budget_${id}_report.csv`);
    return res.status(200).send(result);
  }

  return res.status(200).json(JSON.parse(result));
});

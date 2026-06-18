import { Router } from 'express';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import * as financialController from '../controllers/financialController.js';

const router = Router();

// Secure all financial routes with student auth
router.use(requireStudentAuth);

// Budgets
router.post('/budgets', financialController.createBudget);
router.get('/budgets', financialController.getBudgets);
router.get('/budgets/:id', financialController.getBudgetById);
router.put('/budgets/:id', financialController.updateBudget);
router.delete('/budgets/:id', financialController.deleteBudget);
router.post('/budgets/:id/clone', financialController.cloneBudget);

// Expenses
router.post('/expenses', financialController.createExpense);
router.get('/expenses', financialController.getExpenses);
router.put('/expenses/:id', financialController.updateExpense);
router.delete('/expenses/:id', financialController.deleteExpense);

// Revenue
router.post('/revenues', financialController.createRevenue);
router.get('/revenues', financialController.getRevenues);
router.delete('/revenues/:id', financialController.deleteRevenue);

// Reports & Calculations
router.get('/budgets/:id/variance', financialController.getBudgetVariance);
router.get('/budgets/:id/income-statement', financialController.getIncomeStatement);
router.get('/budgets/:id/cash-flow', financialController.getCashFlowStatement);
router.get('/budgets-utilization', financialController.getBudgetsUtilizationReport);
router.get('/financial-yoy', financialController.getYearOverYearComparison);
router.get('/budgets/:id/export', financialController.exportReport);

export default router;

import { financialRepository } from '../repositories/financialRepository.js';

export class FinancialService {
  checkAccess(user, action, resource = null) {
    if (!user) {
      throw new Error('Authentication required');
    }

    const { role, id: userId } = user;

    // Admin and Treasurer have full access to everything
    if (role === 'admin' || role === 'treasurer') {
      return true;
    }

    // Event organizer has limited access
    if (role === 'organizer') {
      if (!resource) {
        // Can list or create general things for themselves
        return true;
      }
      // Can only view/edit if they created it
      if (
        resource.createdBy === userId ||
        resource.submittedBy === userId ||
        resource.created_by === userId
      ) {
        return true;
      }
      throw new Error('Forbidden: Insufficient permissions for this resource');
    }

    // Regular students/members have no access to financial endpoints
    throw new Error('Forbidden: Insufficient permissions');
  }

  // --- Budgets ---
  async createBudget(budgetData, user) {
    this.checkAccess(user, 'create_budget');

    const budget = {
      ...budgetData,
      createdBy: user.id,
    };

    const newBudget = await financialRepository.createBudget(budget);

    await financialRepository.insertAuditLog({
      action: 'CREATE_BUDGET',
      recordType: 'budget',
      recordId: newBudget.id,
      userId: user.id,
      changes: { new: newBudget },
    });

    return newBudget;
  }

  async getBudgetById(id, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'view_budget', budget);
    return budget;
  }

  async getBudgets(user) {
    this.checkAccess(user, 'list_budgets');
    const allBudgets = await financialRepository.getBudgets();

    // Filter for organizers
    if (user.role === 'organizer') {
      return allBudgets.filter((b) => b.createdBy === user.id);
    }
    return allBudgets;
  }

  async updateBudget(id, patch, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'edit_budget', budget);

    const updated = await financialRepository.updateBudget(id, patch);

    await financialRepository.insertAuditLog({
      action: 'UPDATE_BUDGET',
      recordType: 'budget',
      recordId: id,
      userId: user.id,
      changes: { old: budget, new: updated },
    });

    return updated;
  }

  async deleteBudget(id, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'delete_budget', budget);

    const success = await financialRepository.deleteBudget(id);
    if (success) {
      await financialRepository.insertAuditLog({
        action: 'DELETE_BUDGET',
        recordType: 'budget',
        recordId: id,
        userId: user.id,
        changes: { deleted: budget },
      });
    }
    return success;
  }

  async cloneBudget(id, newEventId, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'create_budget');

    const clonedData = {
      eventId: newEventId,
      name: `${budget.name} (Cloned)`,
      totalAmount: budget.totalAmount,
      startDate: budget.startDate,
      endDate: budget.endDate,
      categoryAllocations: budget.categoryAllocations,
    };

    return this.createBudget(clonedData, user);
  }

  // --- Expenses ---
  async createExpense(expenseData, user) {
    this.checkAccess(user, 'create_expense');

    const expense = {
      ...expenseData,
      status: 'submitted',
      submittedBy: user.id,
    };

    const newExpense = await financialRepository.createExpense(expense);

    await financialRepository.insertAuditLog({
      action: 'CREATE_EXPENSE',
      recordType: 'expense',
      recordId: newExpense.id,
      userId: user.id,
      changes: { new: newExpense },
    });

    // Check budget limit alerts after adding an expense
    if (newExpense.budgetId) {
      await this.checkBudgetAlerts(newExpense.budgetId);
    }

    return newExpense;
  }

  async getExpenseById(id, user) {
    const expense = await financialRepository.getExpenseById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    this.checkAccess(user, 'view_expense', expense);
    return expense;
  }

  async getExpenses(budgetId, user) {
    this.checkAccess(user, 'list_expenses');
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    if (user.role === 'organizer') {
      return expenses.filter((e) => e.submittedBy === user.id);
    }
    return expenses;
  }

  async updateExpense(id, patch, user) {
    const expense = await financialRepository.getExpenseById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    this.checkAccess(user, 'edit_expense', expense);

    // Only admin/treasurer can approve or reimburse
    if (patch.status && patch.status !== expense.status) {
      if (user.role !== 'admin' && user.role !== 'treasurer') {
        throw new Error('Forbidden: Only admins or treasurers can update expense status');
      }
      if (patch.status === 'approved' || patch.status === 'reimbursed') {
        patch.approvedBy = user.id;
      }
    }

    const updated = await financialRepository.updateExpense(id, patch);

    await financialRepository.insertAuditLog({
      action: patch.status ? `TRANSITION_EXPENSE_${patch.status.toUpperCase()}` : 'UPDATE_EXPENSE',
      recordType: 'expense',
      recordId: id,
      userId: user.id,
      changes: { old: expense, new: updated },
    });

    if (updated.budgetId) {
      await this.checkBudgetAlerts(updated.budgetId);
    }

    return updated;
  }

  async deleteExpense(id, user) {
    const expense = await financialRepository.getExpenseById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    this.checkAccess(user, 'delete_expense', expense);

    const success = await financialRepository.deleteExpense(id);
    if (success) {
      await financialRepository.insertAuditLog({
        action: 'DELETE_EXPENSE',
        recordType: 'expense',
        recordId: id,
        userId: user.id,
        changes: { deleted: expense },
      });
    }
    return success;
  }

  // --- Revenue ---
  async createRevenue(revenueData, user) {
    this.checkAccess(user, 'create_revenue');

    const revenue = {
      ...revenueData,
      createdBy: user.id,
    };

    const newRevenue = await financialRepository.createRevenue(revenue);

    await financialRepository.insertAuditLog({
      action: 'CREATE_REVENUE',
      recordType: 'revenue',
      recordId: newRevenue.id,
      userId: user.id,
      changes: { new: newRevenue },
    });

    return newRevenue;
  }

  async getRevenues(budgetId, user) {
    this.checkAccess(user, 'list_revenues');
    const revenues = await financialRepository.getRevenuesByBudgetId(budgetId);

    if (user.role === 'organizer') {
      return revenues.filter((r) => r.createdBy === user.id);
    }
    return revenues;
  }

  async deleteRevenue(id, user) {
    const revenue = await financialRepository.getRevenueById(id);
    if (!revenue) {
      throw new Error('Revenue entry not found');
    }
    this.checkAccess(user, 'delete_revenue', revenue);

    const success = await financialRepository.deleteRevenue(id);
    if (success) {
      await financialRepository.insertAuditLog({
        action: 'DELETE_REVENUE',
        recordType: 'revenue',
        recordId: id,
        userId: user.id,
        changes: { deleted: revenue },
      });
    }
    return success;
  }

  // --- Reports & Calculations ---
  async checkBudgetAlerts(budgetId) {
    const budget = await financialRepository.getBudgetById(budgetId);
    if (!budget) return null;

    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);
    const approvedExpensesSum = expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.amount, 0);

    const ratio = budget.totalAmount > 0 ? approvedExpensesSum / budget.totalAmount : 0;

    let alertLevel = null;
    if (ratio >= 1.0) {
      alertLevel = '100%';
    } else if (ratio >= 0.9) {
      alertLevel = '90%';
    } else if (ratio >= 0.8) {
      alertLevel = '80%';
    }

    if (alertLevel) {
      // In a real app, send socket notification or email. We will return the alert state
      return {
        budgetId,
        budgetName: budget.name,
        totalAmount: budget.totalAmount,
        spentAmount: approvedExpensesSum,
        ratio,
        alertLevel,
      };
    }
    return null;
  }

  async getBudgetVariance(budgetId, user) {
    const budget = await this.getBudgetById(budgetId, user);
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    // Sum actual spending per category (only approved/reimbursed count as actual spending)
    const actualByCategory = {};
    expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .forEach((e) => {
        actualByCategory[e.category] = (actualByCategory[e.category] || 0) + e.amount;
      });

    const categories = Object.keys(budget.categoryAllocations);
    // Include categories from actual expenses if not in budget definitions
    Object.keys(actualByCategory).forEach((cat) => {
      if (!categories.includes(cat)) {
        categories.push(cat);
      }
    });

    const comparisons = categories.map((category) => {
      const budgeted = budget.categoryAllocations[category] || 0;
      const actual = actualByCategory[category] || 0;
      const variance = budgeted - actual;
      return {
        category,
        budgeted,
        actual,
        variance,
        status: variance >= 0 ? 'under_budget' : 'over_budget',
      };
    });

    const totalBudgeted = budget.totalAmount;
    const totalActual = comparisons.reduce((sum, c) => sum + c.actual, 0);
    const totalVariance = totalBudgeted - totalActual;

    const alertStatus = await this.checkBudgetAlerts(budgetId);

    return {
      budgetId,
      budgetName: budget.name,
      totalBudgeted,
      totalActual,
      totalVariance,
      alert: alertStatus,
      comparisons,
    };
  }

  async getIncomeStatement(budgetId, user) {
    const budget = await this.getBudgetById(budgetId, user);
    const revenues = await financialRepository.getRevenuesByBudgetId(budgetId);
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfitOrLoss = totalRevenue - totalExpenses;

    return {
      budgetId,
      budgetName: budget.name,
      totalRevenue,
      totalExpenses,
      netProfitOrLoss,
      statementType: netProfitOrLoss >= 0 ? 'Profit' : 'Loss',
    };
  }

  async getCashFlowStatement(budgetId, user) {
    const budget = await this.getBudgetById(budgetId, user);
    const revenues = await financialRepository.getRevenuesByBudgetId(budgetId);
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    const flows = [];

    // Add revenues as positive flow
    revenues.forEach((r) => {
      flows.push({
        type: 'revenue',
        name: r.source,
        description: r.description,
        amount: r.amount,
        date: r.receivedAt,
      });
    });

    // Add approved/reimbursed expenses as negative flow
    expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .forEach((e) => {
        flows.push({
          type: 'expense',
          name: e.name,
          description: `Category: ${e.category}`,
          amount: -e.amount,
          date: e.createdAt,
        });
      });

    // Sort chronologically
    flows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let balance = 0;
    const flowsWithBalance = flows.map((f) => {
      balance += f.amount;
      return {
        ...f,
        runningBalance: balance,
      };
    });

    return {
      budgetId,
      budgetName: budget.name,
      initialBalance: 0,
      finalBalance: balance,
      flows: flowsWithBalance,
    };
  }

  async getBudgetsUtilizationReport(user) {
    const budgets = await this.getBudgets(user);
    const report = [];

    for (const budget of budgets) {
      const expenses = await financialRepository.getExpensesByBudgetId(budget.id);
      const spent = expenses
        .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
        .reduce((sum, e) => sum + e.amount, 0);

      report.push({
        budgetId: budget.id,
        name: budget.name,
        eventId: budget.eventId,
        totalAmount: budget.totalAmount,
        utilizedAmount: spent,
        remainingAmount: budget.totalAmount - spent,
        utilizationPercentage:
          budget.totalAmount > 0 ? Math.round((spent / budget.totalAmount) * 100) : 0,
      });
    }

    return report;
  }

  async getYearOverYearComparison(user) {
    this.checkAccess(user, 'list_budgets');
    const budgets = await financialRepository.getBudgets();

    const yearStats = {};

    for (const budget of budgets) {
      const date = budget.startDate ? new Date(budget.startDate) : new Date(budget.createdAt);
      const year = date.getFullYear();

      if (!yearStats[year]) {
        yearStats[year] = {
          year,
          totalBudgetLimit: 0,
          totalSpent: 0,
          totalRevenue: 0,
        };
      }

      yearStats[year].totalBudgetLimit += budget.totalAmount;

      const expenses = await financialRepository.getExpensesByBudgetId(budget.id);
      const spent = expenses
        .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
        .reduce((sum, e) => sum + e.amount, 0);
      yearStats[year].totalSpent += spent;

      const revenues = await financialRepository.getRevenuesByBudgetId(budget.id);
      const rev = revenues.reduce((sum, r) => sum + r.amount, 0);
      yearStats[year].totalRevenue += rev;
    }

    return Object.values(yearStats).sort((a, b) => b.year - a.year);
  }

  async exportReport(budgetId, format, user) {
    const budget = await this.getBudgetById(budgetId, user);

    if (format.toLowerCase() === 'csv') {
      const variance = await this.getBudgetVariance(budgetId, user);

      let csv = 'Category,Budgeted Amount,Actual Amount,Variance,Status\n';
      variance.comparisons.forEach((c) => {
        csv += `"${c.category}",${c.budgeted},${c.actual},${c.variance},"${c.status}"\n`;
      });
      csv += `\n"Total",${variance.totalBudgeted},${variance.totalActual},${variance.totalVariance},""\n`;
      return csv;
    }

    if (format.toLowerCase() === 'json') {
      const variance = await this.getBudgetVariance(budgetId, user);
      const income = await this.getIncomeStatement(budgetId, user);
      const cashFlow = await this.getCashFlowStatement(budgetId, user);
      return JSON.stringify({ budget, variance, income, cashFlow }, null, 2);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

export const financialService = new FinancialService();

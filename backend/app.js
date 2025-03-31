// app.js
import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from './controllers/userController.js';
import { createTransaction, getTransactions, getTransactionById, updateTransaction, getRecurringTransactions, deleteTransaction } from './controllers/transactionController.js';
import { getSpendingTrendReportConverted, getDashboardSummaryConverted } from './controllers/reportingController.js';
import { getNotificationsForUser } from './controllers/notificationController.js';
import { createGoal, getGoals, getGoalById, updateGoal, deleteGoal } from './controllers/goalController.js';
import { createBudget, getBudgets, getBudgetById, updateBudget, deleteBudget } from './controllers/budgetController.js';

const app = express();
app.use(express.json());

// Set a valid ObjectId string for the simulated authenticated user
app.use((req, res, next) => {
  req.user = { id: "64fabc0123456789abcdef01" };
  next();
});

app.get('/api/users', getAllUsers);
app.get('/api/users/:id', getUserById);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);

app.post('/api/transactions', createTransaction);
app.get('/api/transactions', getTransactions);
app.get('/api/transactions/:id', getTransactionById);
app.put('/api/transactions/:id', updateTransaction);
app.get('/api/transactions/recurring/upcoming', getRecurringTransactions);
app.delete('/api/transactions/:id', deleteTransaction);

app.get('/api/reports/spending-trend-converted', getSpendingTrendReportConverted);
app.get('/api/reports/dashboard-summary-converted', getDashboardSummaryConverted);

app.get('/api/notifications', getNotificationsForUser);

app.post('/api/goals', createGoal);
app.get('/api/goals', getGoals);
app.get('/api/goals/:id', getGoalById);
app.put('/api/goals/:id', updateGoal);
app.delete('/api/goals/:id', deleteGoal);

app.post('/api/budgets', createBudget);
app.get('/api/budgets', getBudgets);
app.get('/api/budgets/:id', getBudgetById);
app.put('/api/budgets/:id', updateBudget);
app.delete('/api/budgets/:id', deleteBudget);

export default app;

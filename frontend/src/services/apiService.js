import api from './api';

// Authentication API call
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    // Optionally, transform error messages here before rethrowing
    throw error;
  }
};

// Fetch all transactions for the Regular User Dashboard
export const getTransactions = async () => {
  try {
    const response = await api.get('/api/transactions');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch budgets for the Regular User Dashboard
export const getBudgets = async () => {
  try {
    const response = await api.get('/api/budgets');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch financial summary for the Admin Dashboard
export const getFinancialSummary = async () => {
  try {
    const response = await api.get('/api/reporting/dashboard-summary');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch all users for the Admin Dashboard
export const getUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Additional API functions (e.g., goals, notifications, spending trends) can be added here following the same pattern.

/**
 * Reporting.jsx
 *
 * Production‑ready Reporting Page for Financial Data Visualization.
 * Displays interactive charts for spending trends and a dashboard summary.
 *
 * International Coding Standards:
 *  - Consistent formatting, clear inline documentation, and descriptive variable names.
 *  - Error handling, responsive design with Material‑UI's Grid system, and modular design.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import api from '../services/api';

// Import and register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Reporting = () => {
  // --- Filtering State ---
  const [timePeriod, setTimePeriod] = useState('monthly'); // Options: daily, weekly, monthly
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');

  // --- Data State ---
  const [spendingTrendData, setSpendingTrendData] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Filtering Options (static for demonstration; consider fetching from API) ---
  const timePeriodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food' },
    { value: 'transport', label: 'Transport' },
    { value: 'entertainment', label: 'Entertainment' },
    // Add more categories as needed
  ];

  const tagOptions = [
    { value: 'all', label: 'All Tags' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'personal', label: 'Personal' },
    // Add more tags as needed
  ];

  /**
   * fetchData - Fetches spending trend data and dashboard summary concurrently
   * using the applied filter options.
   */
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters from filter state
      const params = {
        timePeriod,
        category: category !== 'all' ? category : undefined,
        tag: tag !== 'all' ? tag : undefined,
      };

      // Execute both API calls concurrently
      const [trendResponse, summaryResponse] = await Promise.all([
        api.get('/api/reporting/spending-trend', { params }),
        api.get('/api/reporting/dashboard-summary', { params }),
      ]);
      setSpendingTrendData(trendResponse.data);
      setDashboardSummary(summaryResponse.data);
    } catch (err) {
      // Use optional chaining and fallback to a generic message
      setError(err.response?.data?.message || 'Failed to fetch reporting data.');
    } finally {
      setLoading(false);
    }
  };

  // --- Initial Data Fetch on Component Mount ---
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Prepare Chart Data ---
  const chartData = spendingTrendData
    ? {
      labels: spendingTrendData.labels,
      datasets: [
        {
          label: 'Spending Trend',
          data: spendingTrendData.data,
          fill: false,
          borderColor: '#1976d2',
          tension: 0.1,
        },
      ],
    }
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Title */}
      <Typography variant="h4" gutterBottom>
        Financial Reporting
      </Typography>

      {/* Filter Controls */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Time Period"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              fullWidth
            >
              {timePeriodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              fullWidth
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              fullWidth
            >
              {tagOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} textAlign="right">
            <Button variant="contained" onClick={fetchData}>
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading and Error Feedback */}
      {loading && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Reporting Content */}
      <Grid container spacing={2}>
        {/* Spending Trends Chart Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Spending Trends
            </Typography>
            {chartData ? (
              <Box sx={{ mt: 2 }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Spending Trends Over Time' },
                    },
                  }}
                />
              </Box>
            ) : (
              <Typography>No chart data available.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Dashboard Summary Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dashboard Summary
            </Typography>
            {dashboardSummary ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  <strong>Total Revenue:</strong> ${dashboardSummary.totalRevenue}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Expenses:</strong> ${dashboardSummary.totalExpenses}
                </Typography>
                <Typography variant="body1">
                  <strong>Profit:</strong> ${dashboardSummary.profit}
                </Typography>
              </Box>
            ) : (
              <Typography>No summary data available.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reporting;

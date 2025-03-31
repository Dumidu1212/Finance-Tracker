// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Container, Grid2, Paper, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { io } from 'socket.io-client';
import api from '../services/api';
import { Line } from 'react-chartjs-2';
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

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const UserDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Setup Socket.IO for real-time notifications
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ['websocket'] });
    socket.on('notification', (data) => {
      setNotifications((prev) => [...prev, data]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch transactions, budgets, goals, and chart data concurrently
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transRes, budgetsRes, goalsRes, chartRes] = await Promise.all([
          api.get('/api/transactions'),
          api.get('/api/budgets'),
          api.get('/api/goals'), // Assumes an endpoint for goals
          api.get('/api/reporting/spending-trends'), // Assumes an endpoint for spending trends
        ]);
        setTransactions(transRes.data);
        setBudgets(budgetsRes.data);
        setGoals(goalsRes.data);
        // Prepare data for the spending trends chart
        const { labels, data } = chartRes.data;
        setChartData({
          labels,
          datasets: [
            {
              label: 'Spending Trends',
              data,
              fill: false,
              borderColor: '#1976d2',
              tension: 0.1,
            },
          ],
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Dashboard
      </Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <Grid2 container spacing={2}>
        {/* Transactions Section */}
        <Grid2 item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Transactions</Typography>
            {transactions.length ? (
              <Box sx={{ mt: 2 }}>
                {transactions.map((tx) => (
                  <Box key={tx.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {tx.date} - {tx.description}: ${tx.amount}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography>No transactions found.</Typography>
            )}
          </Paper>
        </Grid2>

        {/* Budgets Section */}
        <Grid2 item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Budgets</Typography>
            {budgets.length ? (
              <Box sx={{ mt: 2 }}>
                {budgets.map((budget) => (
                  <Box key={budget.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {budget.category}: ${budget.spent} / ${budget.total}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography>No budgets found.</Typography>
            )}
          </Paper>
        </Grid2>

        {/* Goals Section */}
        <Grid2 item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Goals</Typography>
            {goals.length ? (
              <Box sx={{ mt: 2 }}>
                {goals.map((goal) => (
                  <Box key={goal.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {goal.title}: {goal.progress}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography>No goals set.</Typography>
            )}
          </Paper>
        </Grid2>

        {/* Spending Trends Chart Section */}
        <Grid2 item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Spending Trends</Typography>
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
        </Grid2>

        {/* Real-time Notifications Section */}
        <Grid2 item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Real-Time Notifications</Typography>
            {notifications.length ? (
              <Box sx={{ mt: 2 }}>
                {notifications.map((notification, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {notification.message}
                  </Alert>
                ))}
              </Box>
            ) : (
              <Typography>No notifications received.</Typography>
            )}
          </Paper>
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default UserDashboard;

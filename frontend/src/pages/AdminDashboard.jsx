// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Container, Grid2, Paper, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { io } from 'socket.io-client';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Setup Socket.IO connection for real‑time notifications
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ['websocket'] });
    socket.on('notification', (data) => {
      setNotifications((prev) => [...prev, data]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch all users and financial summary concurrently
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, summaryResponse] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/reporting/dashboard-summary')
        ]);
        setUsers(usersResponse.data);
        setSummary(summaryResponse.data);
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
        Admin Dashboard
      </Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <Grid2 container spacing={2}>
        {/* Financial Summary Section */}
        <Grid2 item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Financial Summary</Typography>
            {summary ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">Total Revenue: ${summary.totalRevenue}</Typography>
                <Typography variant="body1">Total Expenses: ${summary.totalExpenses}</Typography>
                <Typography variant="body1">Profit: ${summary.profit}</Typography>
              </Box>
            ) : (
              <Typography>No summary data available.</Typography>
            )}
          </Paper>
        </Grid2>

        {/* Users Section */}
        <Grid2 item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">All Users</Typography>
            {users.length ? (
              <Box sx={{ mt: 2 }}>
                {users.map((user) => (
                  <Typography key={user.id} variant="body2">
                    {user.name} - {user.email}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography>No users found.</Typography>
            )}
          </Paper>
        </Grid2>

        {/* Real-time Notifications Section */}
        <Grid item xs={12}>
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
        </Grid>
      </Grid2>
    </Container>
  );
};

export default AdminDashboard;

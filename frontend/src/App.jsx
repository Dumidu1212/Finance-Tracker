// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';  // Ensure this path is correct
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Home from './pages/Home.jsx';
import Reporting from './pages/Reporting.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Change the default route for testing */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/reporting" element={<Reporting />} />
      </Routes>
    </Router>
  );
};

export default App;

// server.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";

import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import scheduleRecurringTransactionNotifications from "./jobs/recurringTransactionNotifications.js";
import scheduleBudgetMonitoring from "./jobs/budgetMonitoring.js";
import scheduleUnusualSpendingNotifications from "./jobs/unusualSpendingNotifications.js";
import schedulePaymentAndGoalReminders from "./jobs/paymentGoalReminders.js";
import scheduleExchangeRateUpdates from "./jobs/exchangeRateUpdater.js";
import { setSocketIO } from "./utils/socket.js";
import { updateExchangeRates } from './utils/exchangeRates.js';

dotenv.config();

const app = express();

// Security and logging middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));

// Connect to MongoDB
connectDB();

// Mount API routes
app.use("/api", routes);
app.use("/api/notifications", notificationRoutes);

// Create an HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store the Socket.IO instance for real-time notifications.
setSocketIO(io);

// Handle Socket.IO connections.
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("joinRoom", (userId) => {
    socket.join(String(userId));
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start background jobs.
scheduleRecurringTransactionNotifications();
scheduleBudgetMonitoring();
scheduleUnusualSpendingNotifications();
schedulePaymentAndGoalReminders();
scheduleExchangeRateUpdates();

// Update exchange rates immediately on startup.
updateExchangeRates();

// Schedule the rates to update every 30 minutes (adjust as needed).
setInterval(updateExchangeRates, 30 * 60 * 1000);

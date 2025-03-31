// routes/index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import transactionRoutes from "./transactionRoutes.js";
import budgetRoutes from "./budgetRoutes.js";
import reportingRoutes from "./reportingRoutes.js";
import goalRoutes from "./goalRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/reporting", reportingRoutes);
router.use("/goals", goalRoutes);

export default router;

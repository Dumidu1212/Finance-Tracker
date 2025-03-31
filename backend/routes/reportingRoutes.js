// routes/reportingRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getSpendingTrendReportConverted,
  getDashboardSummaryConverted
} from "../controllers/reportingController.js";

const router = express.Router();

router.get("/spending-trend-converted", authMiddleware, getSpendingTrendReportConverted);
router.get("/dashboard-summary-converted", authMiddleware, getDashboardSummaryConverted);

export default router;

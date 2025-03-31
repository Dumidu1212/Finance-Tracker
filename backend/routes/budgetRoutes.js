// routes/budgetRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget
} from "../controllers/budgetController.js";

const router = express.Router();

router.post("/", authMiddleware, createBudget);
router.get("/", authMiddleware, getBudgets);
router.get("/:id", authMiddleware, getBudgetById);
router.put("/:id", authMiddleware, updateBudget);
router.delete("/:id", authMiddleware, deleteBudget);

export default router;

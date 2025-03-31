// routes/transactionRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  getRecurringTransactions,
  deleteTransaction,
} from '../controllers/transactionController.js';

const router = express.Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", authMiddleware, getTransactions);
router.get("/:id", authMiddleware, getTransactionById);
router.put("/:id", authMiddleware, updateTransaction);
router.get("/recurring/upcoming", authMiddleware, getRecurringTransactions);
router.delete("/:id", authMiddleware, deleteTransaction);

export default router;

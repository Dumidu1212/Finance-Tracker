// routes/goalRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
} from "../controllers/goalController.js";

const router = express.Router();

router.post("/", authMiddleware, createGoal);
router.get("/", authMiddleware, getGoals);
router.get("/:id", authMiddleware, getGoalById);
router.put("/:id", authMiddleware, updateGoal);
router.delete("/:id", authMiddleware, deleteGoal);

export default router;

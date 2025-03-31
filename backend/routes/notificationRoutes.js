// routes/notificationRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getNotificationsForUser } from "../controllers/notificationController.js";

const router = express.Router();

// GET /api/notifications - Retrieve notifications for the authenticated user.
router.get("/", authMiddleware, getNotificationsForUser);

export default router;

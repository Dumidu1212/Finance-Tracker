import express from "express";
import { check } from "express-validator";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { register, login, refreshToken } from "../controllers/authController.js";

dotenv.config();
const router = express.Router();

// Login rate limiter: max 5 requests in 5 minutes.
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, try again in 5 minutes"
});

// Registration Endpoint
router.post(
  "/register",
  [
    check("username", "Name is required").notEmpty(),
    check("email", "Enter a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 })
  ],
  register
);

// Login Endpoint
router.post(
  "/login",
  loginLimiter,
  [
    check("email", "Enter a valid email").isEmail(),
    check("password", "Password is required").exists()
  ],
  login
);

// Refresh Token Endpoint
router.post("/refresh", refreshToken);

export default router;

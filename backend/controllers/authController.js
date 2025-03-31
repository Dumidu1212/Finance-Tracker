import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

/**
 * Registers a new user.
 * Expects request body to include username, email, password, and role.
 */
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    user = new User({ username, email, password, role });
    await user.save();
    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Logs in an existing user.
 * Expects request body to include email and password.
 * Returns an access token and sets a refresh token cookie.
 */
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { user: { id: user.id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );
    const userID = user.id;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.json({ accessToken, userID });
  } catch (error) {
    return res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Refreshes the access token using the refresh token stored in cookies.
 */
export const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(403).json({ msg: "Access denied" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).json({ msg: "Invalid refresh token" });
    }
    const newAccessToken = jwt.sign(
      { user: { id: decoded.id } },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    res.json({ accessToken: newAccessToken });
  });
};

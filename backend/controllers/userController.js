// controllers/userController.js
import User from "../models/User.js";
import logger from "../utils/logger.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    logger.error(`Error in getAllUsers: ${error.message}`);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    logger.error(`Error in getUserById: ${error.message}`);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (error) {
    logger.error(`Error in updateUser: ${error.message}`);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    logger.error(`Error in deleteUser: ${error.message}`);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socket.js";

/**
 * Creates a notification for a user and emits a real-time event.
 * @param {ObjectId} userId - The user's ID.
 * @param {string} message - The notification message.
 * @param {string} type - The notification type ("upcoming" or "missed").
 * @returns {Promise<Notification>} The created (saved) notification.
 */
export const createNotification = async (userId, message, type = "upcoming") => {
  const notification = new Notification({ user: userId, message, type });
  // Await the save so that we return the saved notification (without the "save" function)
  const savedNotification = await notification.save();

  const io = getSocketIO();
  if (io) {
    // Emit the notification to the user's room.
    io.to(String(userId)).emit("notification", savedNotification);
  }

  return savedNotification;
};

/**
 * Retrieves notifications for the authenticated user.
 */
export const getNotificationsForUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

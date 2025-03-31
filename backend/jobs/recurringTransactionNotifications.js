// jobs/recurringTransactionNotifications.js
import cron from "node-cron";
import Transaction from "../models/Transaction.js";
import { createNotification } from "../controllers/notificationController.js";

/**
 * Calculates the next occurrence date based on a given date and recurrence pattern.
 * Uses UTC to ensure consistency.
 * @param {Date} lastDate - The last occurrence date.
 * @param {string} pattern - Recurrence pattern: "daily", "weekly", or "monthly".
 * @returns {Date} The next occurrence date.
 */
const getNextOccurrence = (lastDate, pattern) => {
  const nextDate = new Date(lastDate);
  switch (pattern) {
    case "daily":
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      break;
    case "weekly":
      nextDate.setUTCDate(nextDate.getUTCDate() + 7);
      break;
    case "monthly":
      nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
      break;
    default:
      throw new Error("Invalid recurrence pattern");
  }
  return nextDate;
};

/**
 * Schedules a cron job to check for upcoming or missed recurring transactions.
 * The job runs at the start of every hour.
 */
const scheduleRecurringTransactionNotifications = () => {
  // Cron schedule: At minute 0 of every hour.
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const currentTimeUTC = new Date(now.toISOString());

      // Find recurring transactions whose recurrence end date is in the future.
      const recurringTransactions = await Transaction.find({
        recurring: true,
        recurrenceEndDate: { $gte: currentTimeUTC }
      });

      for (const transaction of recurringTransactions) {
        const nextOccurrence = getNextOccurrence(transaction.date, transaction.recurrencePattern);
        const diffHours = (nextOccurrence - currentTimeUTC) / (1000 * 60 * 60);

        // If the next occurrence is within the next 24 hours, create an "upcoming" notification.
        if (diffHours > 0 && diffHours <= 24) {
          await createNotification(
            transaction.user,
            `Your recurring transaction (ID: ${transaction._id}) is scheduled for ${nextOccurrence.toISOString()}.`,
            "upcoming"
          );
          console.log(`Created upcoming notification for transaction ${transaction._id}`);
        }

        // If the next occurrence is in the past, create a "missed" notification.
        if (nextOccurrence < currentTimeUTC) {
          await createNotification(
            transaction.user,
            `Your recurring transaction (ID: ${transaction._id}) was due on ${nextOccurrence.toISOString()} and appears to be missed.`,
            "missed"
          );
          console.log(`Created missed notification for transaction ${transaction._id}`);
        }
      }
    } catch (error) {
      console.error("Error processing recurring transaction notifications:", error);
    }
  });
};

export default scheduleRecurringTransactionNotifications;

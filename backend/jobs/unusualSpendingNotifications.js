import cron from "node-cron";
import Transaction from "../models/Transaction.js";
import { createNotification } from "../controllers/notificationController.js";

/**
 * Schedules a cron job to detect unusual spending patterns.
 * If the current month's total expenses for a user exceed
 * 150% of the average monthly expense for the previous 3 months, a notification is generated.
 */
const scheduleUnusualSpendingNotifications = () => {
  // Run daily at 1:00 AM.
  cron.schedule("0 1 * * *", async () => {
    try {
      // Retrieve distinct user IDs with expense transactions.
      const users = await Transaction.distinct("user", { type: "expense" });
      for (const userId of users) {
        const now = new Date();
        const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

        // Current month expenses.
        const currentAgg = await Transaction.aggregate([
          { $match: { user: userId, type: "expense", date: { $gte: currentMonthStart, $lt: currentMonthEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const currentExpense = currentAgg.length > 0 ? currentAgg[0].total : 0;

        // Average expense of previous 3 months.
        const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
        const previousAgg = await Transaction.aggregate([
          { $match: { user: userId, type: "expense", date: { $gte: threeMonthsAgo, $lt: currentMonthStart } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const previousTotal = previousAgg.length > 0 ? previousAgg[0].total : 0;
        const averageExpense = previousTotal / 3;

        if (averageExpense > 0 && currentExpense > averageExpense * 1.5) {
          const message = `Unusual spending alert: Your expenses this month ($${currentExpense.toFixed(2)}) exceed your average monthly expenses ($${averageExpense.toFixed(2)}) by more than 50%. Please review your spending.`;
          await createNotification(userId, message, "unusual");
          console.log(`Created unusual spending notification for user ${userId}`);
        }
      }
    } catch (error) {
      console.error("Error processing unusual spending notifications:", error);
    }
  });
};

export default scheduleUnusualSpendingNotifications;

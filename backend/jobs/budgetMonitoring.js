// jobs/budgetMonitoring.js
import cron from "node-cron";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import { createNotification } from "../controllers/notificationController.js";

/**
 * Calculates total spending for a user during a given period.
 * If 'category' is provided, it filters transactions by that category.
 * Only transactions of type "expense" are considered.
 *
 * @param {ObjectId} userId - The user's ID.
 * @param {Date} period - A Date object representing the start of the budget period.
 * @param {string|null} category - Optional category filter.
 * @returns {Promise<number>} - Total expense amount.
 */
const calculateTotalSpending = async (userId, period, category = null) => {
  // Set start and end of the month (assuming period represents the first day of the month)
  const startOfMonth = new Date(period);
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);

  // Build query for expense transactions in the given period
  const query = {
    user: userId,
    date: { $gte: startOfMonth, $lt: endOfMonth },
    type: "expense"
  };
  if (category) {
    query.category = category;
  }

  const result = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Schedules a cron job to monitor budgets and generate alerts.
 * This job runs daily at midnight.
 */
const scheduleBudgetMonitoring = () => {
  // Cron schedule: At 00:00 every day.
  cron.schedule("0 0 * * *", async () => {
    try {
      // Retrieve all budgets
      const budgets = await Budget.find();
      for (const budget of budgets) {
        // Calculate spending for the budget period
        const totalSpending = await calculateTotalSpending(budget.user, budget.period, budget.category);
        const thresholdPercent = (totalSpending / budget.amount) * 100;
        let message = "";

        if (thresholdPercent >= 90 && thresholdPercent < 100) {
          message = `Your budget${budget.category ? ` for ${budget.category}` : ""} for ${budget.period.toISOString().slice(0, 7)} is nearly exceeded (${thresholdPercent.toFixed(2)}%). Consider reducing discretionary spending.`;
          await createNotification(budget.user, message, "upcoming");
          console.log(`Created budget alert (nearly exceeded) for budget ${budget._id}`);
        } else if (thresholdPercent >= 100) {
          message = `Your budget${budget.category ? ` for ${budget.category}` : ""} for ${budget.period.toISOString().slice(0, 7)} has been exceeded (${thresholdPercent.toFixed(2)}%). Please review your spending and consider revising your budget.`;
          await createNotification(budget.user, message, "missed");
          console.log(`Created budget alert (exceeded) for budget ${budget._id}`);
        }
      }
    } catch (error) {
      console.error("Error processing budget monitoring:", error);
    }
  });
};

export default scheduleBudgetMonitoring;

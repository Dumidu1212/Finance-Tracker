import cron from "node-cron";
import Payment from "../models/Payment.js";
import Goal from "../models/Goal.js";
import { createNotification } from "../controllers/notificationController.js";

/**
 * Schedules a cron job to check for upcoming bill payments and financial goal reminders.
 * - For payments due within the next 3 days and not paid, a reminder is generated.
 * - For goals with deadlines in the next 7 days and not achieved, a reminder is generated.
 */
const schedulePaymentAndGoalReminders = () => {
  // Run daily at 2:00 AM.
  cron.schedule("0 2 * * *", async () => {
    try {
      const now = new Date();

      // Payment reminders: payments due in the next 3 days.
      const upcomingPayments = await Payment.find({
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
        paid: false
      });
      for (const payment of upcomingPayments) {
        const message = `Reminder: Your bill "${payment.title}" of $${payment.amount.toFixed(2)} is due on ${payment.dueDate.toISOString().slice(0,10)}.`;
        await createNotification(payment.user, message, "payment");
        console.log(`Created payment reminder for payment ${payment._id}`);
      }

      // Goal reminders: goals with deadlines in the next 7 days.
      const upcomingGoals = await Goal.find({
        deadline: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        achieved: false
      });
      for (const goal of upcomingGoals) {
        const message = `Reminder: Your financial goal "${goal.description}" (Target: $${goal.targetAmount.toFixed(2)}) is due on ${goal.deadline.toISOString().slice(0,10)}. Current progress: $${goal.currentAmount.toFixed(2)}.`;
        await createNotification(goal.user, message, "goal");
        console.log(`Created goal reminder for goal ${goal._id}`);
      }
    } catch (error) {
      console.error("Error processing payment and goal reminders:", error);
    }
  });
};

export default schedulePaymentAndGoalReminders;

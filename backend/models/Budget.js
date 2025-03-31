// models/Budget.js
import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    // If category is provided, the budget applies only to that category.
    // Otherwise, it applies to overall monthly expenses.
    category: { type: String, default: null },
    // 'period' represents the start of the budget period (e.g., the first day of the month).
    period: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Budget", BudgetSchema);

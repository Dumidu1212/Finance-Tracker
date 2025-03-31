// models/Goal.js
import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    achieved: { type: Boolean, default: false },
    // Auto-allocation settings:
    autoAllocate: { type: Boolean, default: false },
    // Percentage of each income transaction allocated to this goal (e.g., 10 means 10%)
    autoAllocatePercentage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Goal", GoalSchema);

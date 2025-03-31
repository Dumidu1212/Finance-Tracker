// models/Transaction.js
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          amount: { type: Number, required: true },
          // Multi-currency support: record the transaction currency; default is "USD".
          currency: { type: String, default: "USD" },
          type: { type: String, enum: ["income", "expense"], required: true },
          date: { type: Date, required: true, default: Date.now },
          category: { type: String, required: true },
          tags: [{ type: String }],
          description: { type: String },
          recurring: { type: Boolean, default: false },
          recurrencePattern: { type: String, enum: ["daily", "weekly", "monthly"], default: null },
          recurrenceEndDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", TransactionSchema);

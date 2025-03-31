import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);

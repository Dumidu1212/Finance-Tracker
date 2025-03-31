import mongoose from "mongoose";
import argon2 from "argon2";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["Admin", "Regular"], default: "Regular" }
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await argon2.hash(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await argon2.verify(this.password, enteredPassword);
};

export default mongoose.model("User", UserSchema);

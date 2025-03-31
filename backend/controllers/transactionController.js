// controllers/transactionController.js
import Transaction from "../models/Transaction.js";

/**
 * Create a new transaction.
 * The request body should include fields such as amount, currency, type,
 * date, category, tags, description, and recurring details.
 */
export const createTransaction = async (req, res) => {
  try {
    const transactionData = { ...req.body, user: req.user.id };
    const transaction = new Transaction(transactionData);
    // Await the save call and use its returned value:
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieve all transactions for the authenticated user.
 */
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieve a single transaction by its ID.
 */
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Update a transaction by its ID.
 */
export const updateTransaction = async (req, res) => {
  try {
    const updates = req.body;
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieve all recurring transactions for the authenticated user.
 */
export const getRecurringTransactions = async (req, res) => {
  try {
    // Filter transactions that have the recurring flag set to true.
    const recurringTransactions = await Transaction.find({ user: req.user.id, recurring: true }).sort({ date: -1 });
    res.json(recurringTransactions);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Delete a transaction by its ID.
 */
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });
    res.json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

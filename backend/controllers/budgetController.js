// controllers/budgetController.js
import Budget from "../models/Budget.js";

/**
 * Create a new budget for the authenticated user.
 */
export const createBudget = async (req, res) => {
  try {
    const { amount, category, period } = req.body;
    const budget = new Budget({ user: req.user.id, amount, category, period });
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieve all budgets for the authenticated user.
 */
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ period: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieve a single budget by its ID.
 */
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
    if (!budget) return res.status(404).json({ msg: "Budget not found" });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Update a budget by its ID.
 */
export const updateBudget = async (req, res) => {
  try {
    const updates = req.body;
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ msg: "Budget not found" });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Delete a budget by its ID.
 */
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!budget) return res.status(404).json({ msg: "Budget not found" });
    res.json({ msg: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

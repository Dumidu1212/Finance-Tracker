// controllers/goalController.js
import Goal from "../models/Goal.js";

/**
 * Creates a new financial goal.
 */
export const createGoal = async (req, res) => {
  try {
    const { description, targetAmount, deadline, autoAllocate, autoAllocatePercentage } = req.body;
    const goal = new Goal({
      user: req.user.id,
      description,
      targetAmount,
      deadline,
      autoAllocate: autoAllocate || false,
      autoAllocatePercentage: autoAllocatePercentage || 0
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieves all goals for the authenticated user.
 */
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ deadline: 1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Retrieves a goal by its ID, along with its progress percentage.
 */
export const getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ msg: "Goal not found" });
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    res.json({ ...goal.toObject(), progress: progress.toFixed(2) });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Updates a goal by its ID.
 */
export const updateGoal = async (req, res) => {
  try {
    const updates = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ msg: "Goal not found" });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Deletes a goal by its ID.
 */
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ msg: "Goal not found" });
    res.json({ msg: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Automatically allocates a percentage of an income transaction to all goals
 * for the user that have autoAllocate enabled.
 *
 * For each goal with autoAllocate === true, adds:
 *    incomeAmount * (autoAllocatePercentage / 100)
 * to its currentAmount. Marks the goal as achieved if currentAmount >= targetAmount.
 *
 * @param {string} userId - The ID of the user.
 * @param {number} incomeAmount - The income amount.
 */
export const allocateSavingsForUser = async (userId, incomeAmount) => {
  try {
    const goals = await Goal.find({ user: userId, autoAllocate: true });
    for (const goal of goals) {
      const allocation = incomeAmount * (goal.autoAllocatePercentage / 100);
      goal.currentAmount += allocation;
      if (goal.currentAmount >= goal.targetAmount) {
        goal.achieved = true;
      }
      await goal.save();
    }
  } catch (error) {
    console.error("Error allocating savings:", error);
    throw error;
  }
};

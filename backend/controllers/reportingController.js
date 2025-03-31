// controllers/reportingController.js
import Transaction from "../models/Transaction.js";
import { getExchangeRate } from "../utils/exchangeRates.js";

/**
 * Generates a spending trend report with transaction amounts converted to USD.
 * Supports filtering by date range, type, category, and tags. Grouping can be done by day or month.
 *
 * Query Parameters:
 * - startDate: ISO date string (e.g., "2025-01-01")
 * - endDate: ISO date string (e.g., "2025-12-31")
 * - groupBy: "daily" or "monthly" (default: "monthly")
 * - type: "income" or "expense" (optional)
 * - category: string (optional)
 * - tags: comma-separated string (optional)
 *
 * Returns an array of objects, each with a group key, total converted amount, and count.
 */
export const getSpendingTrendReportConverted = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "monthly", type, category, tags } = req.query;
    const baseCurrency = "USD";
    const query = { user: req.user.id };

    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    if (type) query.type = type;
    if (category) query.category = category;
    if (tags) {
      const tagsArr = tags.split(",").map(tag => tag.trim());
      query.tags = { $in: tagsArr };
    }

    const transactions = await Transaction.find(query).lean();

    const report = {};
    transactions.forEach(tx => {
      let conversionRate = 1;
      try {
        conversionRate = tx.currency !== baseCurrency ? getExchangeRate(tx.currency, baseCurrency) : 1;
        console.log(`Converting ${tx.currency} to ${baseCurrency} at rate: ${conversionRate}`);
      } catch (error) {
        console.error(`Exchange rate conversion error for ${tx.currency}:`, error.message);
      }
      const convertedAmount = tx.amount * conversionRate;
      const date = new Date(tx.date);
      let groupKey = "";
      if (groupBy === "daily") {
        groupKey = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
      } else {
        groupKey = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
      }
      if (!report[groupKey]) {
        report[groupKey] = { total: 0, count: 0 };
      }
      report[groupKey].total += convertedAmount;
      report[groupKey].count += 1;
    });

    const sortedReport = Object.keys(report)
      .sort()
      .map(key => ({ group: key, total: report[key].total, count: report[key].count }));

    res.json(sortedReport);
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

/**
 * Returns a dashboard summary (total income, total expense, and net balance)
 * with amounts converted to USD.
 */
export const getDashboardSummaryConverted = async (req, res) => {
  try {
    const userId = req.user.id;
    const baseCurrency = "USD";

    const incomes = await Transaction.find({ user: userId, type: "income" }).lean();
    const totalIncome = incomes.reduce((sum, tx) => {
      let rate = 1;
      try {
        rate = tx.currency !== baseCurrency ? getExchangeRate(tx.currency, baseCurrency) : 1;
      } catch (error) {
        console.error(`Error converting income from ${tx.currency}:`, error.message);
      }
      return sum + (tx.amount * rate);
    }, 0);

    const expenses = await Transaction.find({ user: userId, type: "expense" }).lean();
    const totalExpense = expenses.reduce((sum, tx) => {
      let rate = 1;
      try {
        rate = tx.currency !== baseCurrency ? getExchangeRate(tx.currency, baseCurrency) : 1;
      } catch (error) {
        console.error(`Error converting expense from ${tx.currency}:`, error.message);
      }
      return sum + (tx.amount * rate);
    }, 0);

    res.json({ totalIncome, totalExpense, netBalance: totalIncome - totalExpense });
  } catch (error) {
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const categoryHelpers = import("../../shared/categoryHelpers.mjs");

const IST_OFFSET_MINUTES = 330;

const getCurrentMonthRange = (date = new Date()) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const utcOffset = IST_OFFSET_MINUTES * 60 * 1000;

  return {
    start: new Date(Date.UTC(year, month, 1) - utcOffset),
    end: new Date(Date.UTC(year, month + 1, 1) - utcOffset),
  };
};

const getBudgetLevel = (percentUsed) => {
  if (percentUsed >= 100) return "exceeded";
  if (percentUsed >= 80) return "warning";
  return "ok";
};

const getBudgetStatus = async (userId, date = new Date()) => {
  const userObjectId = new mongoose.Types.ObjectId(String(userId));
  const { start, end } = getCurrentMonthRange(date);
  const budgets = await Budget.find({ userId: userObjectId }).sort({ category: 1 });
  const customBudgetNames = budgets
    .filter((budget) => budget.category === "Other" && budget.customCategory)
    .map((budget) => budget.customCategory.toLowerCase());
  const spending = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        date: { $gte: start, $lt: end },
      },
    },
    {
      $addFields: {
        normalizedCustomCategory: {
          $toLower: {
            $trim: { input: { $ifNull: ["$customCategory", ""] } },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          category: "$category",
          customCategory: {
            $cond: [
              {
                $and: [
                  { $eq: ["$category", "Other"] },
                  { $in: ["$normalizedCustomCategory", customBudgetNames] },
                ],
              },
              "$normalizedCustomCategory",
              "",
            ],
          },
        },
        spent: { $sum: "$amount" },
      },
    },
  ]);
  const { getCategoryLabel } = await categoryHelpers;

  const spendingByCategory = new Map(
    spending.map((item) => [
      `${item._id.category}:${item._id.customCategory}`,
      item.spent,
    ])
  );

  return budgets.map((budget) => {
    const customCategory =
      budget.category === "Other" ? budget.customCategory || "" : "";
    const spent =
      spendingByCategory.get(`${budget.category}:${customCategory.toLowerCase()}`) || 0;
    const percentUsed = (spent / budget.monthlyLimit) * 100;

    return {
      ...budget.toObject(),
      customCategory,
      label: getCategoryLabel({ category: budget.category, customCategory }),
      spent,
      remaining: Math.max(budget.monthlyLimit - spent, 0),
      percentUsed,
      level: getBudgetLevel(percentUsed),
    };
  });
};

const checkBudgetAfterExpenseChange = async (userId, expenses) => {
  const budgetStatus = await getBudgetStatus(userId);
  const changedExpenses = Array.isArray(expenses) ? expenses : [expenses];
  const affectedBudgets = new Map();

  changedExpenses.forEach((expense) => {
    if (!expense?.category) return;

    const expenseCustomCategory =
      expense.category === "Other"
        ? (expense.customCategory || "").trim().toLocaleLowerCase()
        : "";
    const customBudget = expenseCustomCategory
      ? budgetStatus.find((budget) =>
        budget.category === "Other" &&
        (budget.customCategory || "").trim().toLocaleLowerCase() === expenseCustomCategory
      )
      : null;
    const matchingBudget = customBudget || budgetStatus.find((budget) => {
      if (budget.category !== expense.category) return false;
      if (expense.category !== "Other") return true;
      const budgetCustomCategory = (budget.customCategory || "").trim().toLocaleLowerCase();
      return !budgetCustomCategory;
    });

    if (matchingBudget) {
      affectedBudgets.set(String(matchingBudget._id), {
        budgetId: String(matchingBudget._id),
        category: matchingBudget.category,
        customCategory: matchingBudget.customCategory,
        label: matchingBudget.label,
        spent: matchingBudget.spent,
        limit: matchingBudget.monthlyLimit,
        percentUsed: matchingBudget.percentUsed,
        level: matchingBudget.level,
      });
    }
  });

  const results = [...affectedBudgets.values()];
  if (results.length <= 1) return results[0] || null;
  return results;
};

module.exports = {
  getBudgetStatus,
  checkBudgetAfterExpenseChange,
  getBudgetLevel,
  getCurrentMonthRange,
};

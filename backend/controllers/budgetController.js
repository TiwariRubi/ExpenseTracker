const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");
const expenseCategories = require("../../shared/expenseCategories.json");
const { getBudgetStatus } = require("../utils/budgetStatus");
const categoryHelpers = import("../../shared/categoryHelpers.mjs");

const getBudgetDetails = async (body) => {
  const { normalizeCustomCategory } = await categoryHelpers;
  const { category, customCategory, monthlyLimit } = body || {};

  if (typeof category !== "string" ||
      !expenseCategories.some((item) => item.name === category.trim())) {
    return { error: "Invalid budget category" };
  }

  if ((typeof monthlyLimit !== "number" && typeof monthlyLimit !== "string") ||
      (typeof monthlyLimit === "string" && !monthlyLimit.trim())) {
    return { error: "Monthly limit must be a number greater than 0" };
  }

  const limit = Number(monthlyLimit);
  if (!Number.isFinite(limit) || limit <= 0) {
    return { error: "Monthly limit must be a number greater than 0" };
  }

  let normalizedCustomCategory = "";
  if (category.trim() === "Other" && customCategory !== undefined && customCategory !== "") {
    if (typeof customCategory !== "string") {
      return { error: "Custom category must be 30 characters or fewer" };
    }

    normalizedCustomCategory = normalizeCustomCategory(customCategory);
    if (normalizedCustomCategory.length > 30) {
      return { error: "Custom category must be 30 characters or fewer" };
    }
  }

  return {
    category: category.trim(),
    customCategory: normalizedCustomCategory,
    monthlyLimit: limit,
  };
};

const isDuplicateBudget = (error) => error.code === 11000;
const getDuplicateBudgetMessage = (budgetDetails) =>
  budgetDetails.category === "Other" && budgetDetails.customCategory
    ? "A budget already exists for this custom category"
    : "A budget already exists for this category";

// Get All Budgets
exports.getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id }).sort({ category: 1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Budget Spending Status
exports.getBudgetStatus = async (req, res) => {
  try {
    const budgetStatus = await getBudgetStatus(req.user.id);
    res.json(budgetStatus);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add Budget
exports.addBudget = async (req, res) => {
  const budgetDetails = await getBudgetDetails(req.body);
  if (budgetDetails.error) {
    return res.status(400).json({ message: budgetDetails.error });
  }

  try {
    const budget = new Budget({
      userId: req.user.id,
      ...budgetDetails,
    });
    await budget.save();
    res.status(200).json(budget);
  } catch (error) {
    if (isDuplicateBudget(error)) {
      return res.status(409).json({ message: getDuplicateBudgetMessage(budgetDetails) });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Budget
exports.updateBudget = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid budget id" });
  }

  const budgetDetails = await getBudgetDetails(req.body);
  if (budgetDetails.error) {
    return res.status(400).json({ message: budgetDetails.error });
  }

  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      budgetDetails,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json(budget);
  } catch (error) {
    if (isDuplicateBudget(error)) {
      return res.status(409).json({ message: getDuplicateBudgetMessage(budgetDetails) });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete Budget
exports.deleteBudget = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid budget id" });
  }

  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    try {
      await Notification.deleteMany({
        userId: req.user.id,
        isRead: false,
        "meta.budgetId": String(budget._id),
      });
    } catch (error) {
      console.error("Error deleting budget notifications:", error.message);
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

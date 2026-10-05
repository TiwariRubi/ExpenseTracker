const xlsx= require('xlsx');
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const expenseCategories = require("../../shared/expenseCategories.json");
const buildTransactionFilters = require("../utils/transactionFilters");
const { checkBudgetAfterExpenseChange } = require("../utils/budgetStatus");
const categoryHelpers = import("../../shared/categoryHelpers.mjs");

const getCustomCategory = (category, customCategory, normalizeCustomCategory) => {
  if (category !== "Other") {
    return "";
  }

  if (typeof customCategory !== "string" || !customCategory.trim()) {
    return null;
  }

  const normalizedCategory = normalizeCustomCategory(customCategory);
  return normalizedCategory.length <= 30 ? normalizedCategory : null;
};

//Add Expense Source
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { normalizeCustomCategory } = await categoryHelpers;
    const { icon, category, customCategory, amount, date, description } = req.body || {};

    // Validation : check for missing fields
    if (!category || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (description !== undefined &&
        (typeof description !== "string" || description.trim().length > 100)) {
      return res.status(400).json({ message: "Description must be 100 characters or fewer" });
    }

    if (typeof category !== "string" || !expenseCategories.some((item) => item.name === category.trim())) {
      return res.status(400).json({ message: "Invalid expense category" });
    }

    const normalizedCategory = category.trim();
    const expenseCustomCategory = getCustomCategory(
      normalizedCategory,
      customCategory,
      normalizeCustomCategory
    );
    if (expenseCustomCategory === null) {
      return res.status(400).json({ message: "Enter a custom category of 30 characters or fewer" });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category: normalizedCategory,
      customCategory: expenseCustomCategory,
      description: description === undefined ? "" : description.trim(),
      amount,
      date: new Date(date)
    });

    await newExpense.save();
    const budgetStatus = await checkBudgetAfterExpenseChange(userId, newExpense);
    res.status(200).json({ ...newExpense.toObject(), budgetStatus });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { normalizeCustomCategory } = await categoryHelpers;
    const { icon, category, customCategory, amount, date, description } = req.body || {};

    if (typeof category !== "string" || !category.trim() || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!expenseCategories.some((item) => item.name === category.trim())) {
      return res.status(400).json({ message: "Invalid expense category" });
    }

    const normalizedCategory = category.trim();
    const expenseCustomCategory = getCustomCategory(
      normalizedCategory,
      customCategory,
      normalizeCustomCategory
    );
    if (expenseCustomCategory === null) {
      return res.status(400).json({ message: "Enter a custom category of 30 characters or fewer" });
    }

    if (description !== undefined &&
        (typeof description !== "string" || description.trim().length > 100)) {
      return res.status(400).json({ message: "Description must be 100 characters or fewer" });
    }

    if ((typeof amount !== "number" && typeof amount !== "string") ||
        (typeof amount === "string" && !amount.trim()) ||
        typeof date !== "string") {
      return res.status(400).json({ message: "Invalid expense details" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    if (icon !== undefined && typeof icon !== "string") {
      return res.status(400).json({ message: "Invalid expense details" });
    }

    const expenseAmount = Number(amount);
    const expenseDate = new Date(date);

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0 || Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({ message: "Invalid expense details" });
    }

    const expenseDetails = {
      icon,
      category: normalizedCategory,
      customCategory: expenseCustomCategory,
      amount: expenseAmount,
      date: expenseDate,
    };
    if (description !== undefined) {
      expenseDetails.description = description.trim();
    }

    const previousExpense = await Expense.findOne({ _id: req.params.id, userId });
    if (!previousExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId },
      expenseDetails,
      { new: true, runValidators: true }
    );
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const budgetStatus = await checkBudgetAfterExpenseChange(userId, [
      previousExpense,
      expense,
    ]);
    res.status(200).json({ ...expense.toObject(), budgetStatus });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Expense Source
exports.getAllExpense = async (req, res) => {
     const userId =req.user.id;
     try{
      const filters = buildTransactionFilters(
        userId,
        req.query,
        ["category", "customCategory", "description"],
        "category"
      );
      if (req.query.category && !expenseCategories.some((item) => item.name === req.query.category)) {
        return res.status(400).json({ message: "Invalid expense category filter" });
      }
      const expense = await Expense.find(filters).sort({ date: -1 });
      res.json(expense);
     } catch (error){
      if (error.statusCode === 400) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server Error"});
     }
};

// Get Custom Expense Categories
exports.getCustomExpenseCategories = async (req, res) => {
  const userId = req.user.id;

  try {
    const { normalizeCustomCategory } = await categoryHelpers;
    const customCategories = await Expense.distinct("customCategory", {
      userId,
      category: "Other",
      customCategory: { $nin: ["", null] },
    });
    const uniqueCategories = new Map();

    customCategories.forEach((category) => {
      if (typeof category === "string" && category.trim()) {
        const normalizedCategory = normalizeCustomCategory(category);
        uniqueCategories.set(normalizedCategory.toLocaleLowerCase(), normalizedCategory);
      }
    });

    res.json([...uniqueCategories.values()].sort((first, second) => first.localeCompare(second)));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete Expense Source
exports.deleteExpense = async (req, res) => {
   const userId = req.user.id;

   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
     return res.status(400).json({ message: "Invalid expense id" });
   }

   try{
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    const budgetStatus = await checkBudgetAfterExpenseChange(userId, expense);
    res.json({ message:"Expense deleted successfully", budgetStatus });
   }catch(error){
    res.status(500).json({ message: "Server Error", error: error.message });
   }
};

// Download Excel
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user.id;
    try{
      const { getCategoryLabel } = await categoryHelpers;
      const expense= await Expense.find({ userId}).sort({ date: -1});

      // prepare data for Excel
      const data =expense.map((item) =>({
        Category : getCategoryLabel(item),
        Amount: item.amount,
        Date: item.date,
      }));
      const wb=xlsx.utils.book_new();
      const ws =xlsx.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 18 }];
      for (let row = 2; row <= expense.length + 1; row++) {
        const dateCell = ws[`C${row}`];
        if (dateCell) dateCell.z = 'dd/mm/yyyy';
      }
      xlsx.utils.book_append_sheet(wb, ws, "Expense");
      xlsx.writeFile(wb, 'expense_details.xlsx');
      res.download('expense_details.xlsx');
    }catch(error){
      res.status(500).json({ message: "Server Error"});
    }
};
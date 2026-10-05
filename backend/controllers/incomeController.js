const xlsx= require('xlsx');
const mongoose = require("mongoose");
const Income = require("../models/Income");
const buildTransactionFilters = require("../utils/transactionFilters");

const normalizeSource = (source) => source.trim().replace(/\s+/g, " ");
const formatSourceLabel = (source) => normalizeSource(source)
  .split(" ")
  .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
  .join(" ");

//Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date, description } = req.body || {};

    // Validation : check for missing fields
    if (typeof source !== "string" || !normalizeSource(source) || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (description !== undefined &&
        (typeof description !== "string" || description.trim().length > 100)) {
      return res.status(400).json({ message: "Description must be 100 characters or fewer" });
    }

    const newIncome = new Income({
      userId,
      icon,
      source: normalizeSource(source),
      description: description === undefined ? "" : description.trim(),
      amount,
      date: new Date(date)
    });

    await newIncome.save();
    res.status(200).json(newIncome);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Income
exports.updateIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date, description } = req.body || {};

    if (typeof source !== "string" || !source.trim() || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (description !== undefined &&
        (typeof description !== "string" || description.trim().length > 100)) {
      return res.status(400).json({ message: "Description must be 100 characters or fewer" });
    }

    if ((typeof amount !== "number" && typeof amount !== "string") ||
        (typeof amount === "string" && !amount.trim()) ||
        typeof date !== "string") {
      return res.status(400).json({ message: "Invalid income details" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid income id" });
    }

    if (icon !== undefined && typeof icon !== "string") {
      return res.status(400).json({ message: "Invalid income details" });
    }

    const incomeAmount = Number(amount);
    const incomeDate = new Date(date);

    if (!Number.isFinite(incomeAmount) || incomeAmount <= 0 || Number.isNaN(incomeDate.getTime())) {
      return res.status(400).json({ message: "Invalid income details" });
    }

    const incomeDetails = {
      icon,
      source: normalizeSource(source),
      amount: incomeAmount,
      date: incomeDate,
    };
    if (description !== undefined) {
      incomeDetails.description = description.trim();
    }

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId },
      incomeDetails,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.status(200).json(income);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Income Source
exports.getAllIncome = async (req, res) => {
     const userId =req.user.id;
     try{
      const filters = buildTransactionFilters(
        userId,
        req.query,
        ["source", "description"],
        "source"
      );
      const income = await Income.find(filters).sort({ date: -1 });
      res.json(income);
     } catch (error){
      if (error.statusCode === 400) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server Error"});
     }
};

// Get Income Source Suggestions
exports.getIncomeSourceSuggestions = async (req, res) => {
  const userId = req.user.id;

  try {
    const sources = await Income.distinct("source", { userId });
    const uniqueSources = new Map();

    sources.forEach((source) => {
      if (typeof source === "string" && normalizeSource(source)) {
        const normalizedSource = formatSourceLabel(source);
        uniqueSources.set(normalizedSource.toLocaleLowerCase(), normalizedSource);
      }
    });

    res.json([...uniqueSources.values()].sort((first, second) => first.localeCompare(second)));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete Income Source
exports.deleteIncome = async (req, res) => {
   
   try{
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message:"Income deleted successfully"});
   }catch(error){
    res.status(500).json({message:"Server Error"});
   }
};

// Download Excel
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user.id;
    try{
      const income= await Income.find({ userId}).sort({ date: -1});

      // prepare data for Excel
      const data =income.map((item) =>({
        Source : item.source,
        Amount: item.amount,
        Date: item.date,
      }));
      const wb=xlsx.utils.book_new();
      const ws =xlsx.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 18 }];
      for (let row = 2; row <= income.length + 1; row++) {
        const dateCell = ws[`C${row}`];
        if (dateCell) dateCell.z = 'dd/mm/yyyy';
      }
      xlsx.utils.book_append_sheet(wb, ws, "Income");
      xlsx.writeFile(wb, 'income_details.xlsx');
      res.download('income_details.xlsx');
    }catch(error){
      res.status(500).json({ message: "Server Error"});
    }
};
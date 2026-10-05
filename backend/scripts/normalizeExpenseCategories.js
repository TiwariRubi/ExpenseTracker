require("dotenv").config();
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const expenseCategories = require("../../shared/expenseCategories.json");

const categoryNames = expenseCategories.map((category) => category.name);

const normalizeCategory = (category) => {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const matchedCategory = categoryNames.find(
    (categoryName) => categoryName.toLowerCase() === normalizedCategory
  );

  return matchedCategory || "Other";
};

const migrateExpenseCategories = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required");
  }

  await mongoose.connect(process.env.MONGO_URL);

  const existingCategories = await Expense.distinct("category");
  let updatedCount = 0;

  for (const category of existingCategories) {
    const normalizedCategory = normalizeCategory(category);

    if (category !== normalizedCategory) {
      const result = await Expense.updateMany(
        { category },
        { $set: { category: normalizedCategory } }
      );
      updatedCount += result.modifiedCount;
    }
  }

  console.log(`Updated ${updatedCount} expense categories`);
};

migrateExpenseCategories()
  .catch((error) => {
    console.error("Expense category migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

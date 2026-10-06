require("dotenv").config();
const mongoose = require("mongoose");
const Budget = require("../models/Budget");

const migrateBudgetCustomCategories = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required");
  }

  await mongoose.connect(process.env.MONGO_URL);

  const indexes = await Budget.collection.indexes();
  for (const index of indexes) {
    const keys = Object.keys(index.key || {});
    if (keys.length === 2 && index.key.userId === 1 && index.key.category === 1) {
      await Budget.collection.dropIndex(index.name);
    }
  }

  await Budget.collection.createIndex(
    { userId: 1, category: 1, customCategory: 1 },
    { unique: true }
  );

  console.log("Budget custom category index is up to date");
};

migrateBudgetCustomCategories()
  .catch((error) => {
    console.error("Budget custom category migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

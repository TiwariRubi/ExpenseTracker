const mongoose = require("mongoose");
const expenseCategories = require("../../shared/expenseCategories.json");

const BudgetSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  category: {type: String, required: true, enum: expenseCategories.map((category) => category.name)},
  customCategory: {type: String, trim: true, maxlength: 30, default: ""},
  monthlyLimit: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: "Monthly limit must be greater than 0",
    },
  },
}, {timestamps: true});

BudgetSchema.index({userId: 1, category: 1, customCategory: 1}, {unique: true});

module.exports = mongoose.model("Budget", BudgetSchema);

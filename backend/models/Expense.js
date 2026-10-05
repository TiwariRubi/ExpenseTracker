const mongoose = require("mongoose");
const expenseCategories = require("../../shared/expenseCategories.json");

const ExpenseSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required:true},
  icon: {type: String },
  category: {type: String, required: true, enum: expenseCategories.map((category) => category.name)},
  customCategory: {type: String, trim: true, maxlength: 30, default: ""},
  description: {type: String, trim: true, maxlength: 100, default: ""},
  amount: {type:Number, required: true},
  date: { type: Date, default: Date.now },
},{ timestamps: true });

module.exports= mongoose.model("Expense",ExpenseSchema);
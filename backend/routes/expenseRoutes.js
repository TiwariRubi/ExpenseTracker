const express =require("express");
const{
  addExpense,
  updateExpense,
  getAllExpense,
  getCustomExpenseCategories,
  deleteExpense,
  downloadExpenseExcel
} = require("../controllers/expenseController");
const {protect}= require("../middleware/authMiddleware");

const router =express.Router();

router.post("/add",protect,addExpense);
router.put("/:id",protect,updateExpense);
router.get("/get",protect,getAllExpense);
router.get("/custom-categories",protect,getCustomExpenseCategories);
router.get("/downloadexcel",protect,downloadExpenseExcel);
router.delete("/:id",protect, deleteExpense);

module.exports=router;

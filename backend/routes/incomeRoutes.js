const express =require("express");
const{
  addIncome,
  updateIncome,
  getAllIncome,
  getIncomeSourceSuggestions,
  deleteIncome,
  downloadIncomeExcel
} = require("../controllers/incomeController");
const {protect}= require("../middleware/authMiddleware");

const router =express.Router();

router.post("/add",protect,addIncome);
router.put("/:id",protect,updateIncome);
router.get("/get",protect,getAllIncome);
router.get("/source-suggestions",protect,getIncomeSourceSuggestions);
router.get("/downloadexcel",protect,downloadIncomeExcel);
router.delete("/:id",protect,deleteIncome);

module.exports=router;

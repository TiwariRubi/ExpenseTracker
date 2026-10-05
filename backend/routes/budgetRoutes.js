const express = require("express");
const {
  getAllBudgets,
  getBudgetStatus,
  addBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/status", protect, getBudgetStatus);
router.get("/", protect, getAllBudgets);
router.post("/", protect, addBudget);
router.put("/:id", protect, updateBudget);
router.delete("/:id", protect, deleteBudget);

module.exports = router;

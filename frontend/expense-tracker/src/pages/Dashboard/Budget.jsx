import React, {useEffect, useState} from 'react'
import { LuEllipsisVertical, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import Modal from '../../components/Modal'
import DeleteAlert from '../../components/DeleteAlert'
import Input from '../../components/Inputs/Input'
import { useUserAuth } from '../../hooks/useUserAuth'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import expenseCategories from '../../../../../shared/expenseCategories.json'
import { getCategoryLabel, normalizeCustomCategory } from '../../../../../shared/categoryHelpers.mjs'

const formatAmount = (amount) => Number(amount || 0).toLocaleString("en-IN")

const Budget = () => {
  useUserAuth();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshData, setRefreshData] = useState(0);
  const [openBudgetModal, setOpenBudgetModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);
  const [budget, setBudget] = useState({ category: "", customCategory: "", monthlyLimit: "" });
  const [customCategories, setCustomCategories] = useState([]);
  const [budgetFormError, setBudgetFormError] = useState("");
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchBudgetStatus = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(API_PATHS.BUDGET.GET_STATUS, {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid budget status response");
        }
        setBudgets(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "Error fetching budgets:",
            error.response?.data?.message || error.message
          );
          toast.error(error.response?.data?.message || "Unable to load budgets.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBudgetStatus();
    return () => controller.abort();
  }, [refreshData]);

  useEffect(() => {
    if (!openBudgetModal) return;

    const controller = new AbortController();
    const fetchCustomCategories = async () => {
      try {
        const response = await axiosInstance.get(
          API_PATHS.EXPENSE.GET_CUSTOM_EXPENSE_CATEGORIES,
          { signal: controller.signal }
        );
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid custom category response");
        }
        setCustomCategories(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "Error fetching custom expense categories:",
            error.response?.data?.message || error.message
          );
          toast.error(error.response?.data?.message || "Unable to load custom categories.");
        }
      }
    };

    fetchCustomCategories();
    return () => controller.abort();
  }, [openBudgetModal]);

  const openAddBudget = () => {
    setBudgetToEdit(null);
    setBudget({ category: "", customCategory: "", monthlyLimit: "" });
    setBudgetFormError("");
    setOpenBudgetModal(true);
  };

  const openEditBudget = (item) => {
    setBudgetToEdit(item);
    setBudget({
      category: item.category,
      customCategory: item.customCategory || "",
      monthlyLimit: String(item.monthlyLimit),
    });
    setBudgetFormError("");
    setOpenBudgetModal(true);
    setOpenMenuId(null);
  };

  const closeBudgetModal = () => {
    setOpenBudgetModal(false);
    setBudgetToEdit(null);
    setBudgetFormError("");
  };

  const availableCategories = expenseCategories.filter((category) =>
    category.name === "Other" ||
    category.name === budgetToEdit?.category ||
    !budgets.some((item) => item.category === category.name)
  );

  const handleBudgetChange = (key, value) => {
    setBudgetFormError("");
    setBudget((previousBudget) => {
      if (key === "category") {
        return {
          ...previousBudget,
          category: value,
          customCategory: value === "Other" ? previousBudget.customCategory : "",
        };
      }
      return { ...previousBudget, [key]: value };
    });
  };

  const handleSaveBudget = async () => {
    const monthlyLimit = Number(budget.monthlyLimit);
    const customCategory = budget.category === "Other"
      ? normalizeCustomCategory(budget.customCategory)
      : "";
    if (!budget.category) {
      toast.error("Select a category.");
      return;
    }
    if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      toast.error("Monthly limit must be greater than 0.");
      return;
    }

    const duplicateBudget = budgets.some((item) => {
      if (item._id === budgetToEdit?._id || item.category !== budget.category) return false;
      if (budget.category !== "Other") return true;
      return (item.customCategory || "").trim().toLocaleLowerCase() ===
        customCategory.toLocaleLowerCase();
    });
    if (duplicateBudget) {
      setBudgetFormError(
        customCategory
          ? "A budget already exists for this custom category."
          : "A budget already exists for the general Other category."
      );
      return;
    }

    const budgetDetails = { ...budget, customCategory, monthlyLimit };
    try {
      if (budgetToEdit) {
        await axiosInstance.put(
          API_PATHS.BUDGET.UPDATE(budgetToEdit._id),
          budgetDetails
        );
      } else {
        await axiosInstance.post(API_PATHS.BUDGET.ADD, budgetDetails);
      }
      closeBudgetModal();
      toast.success(budgetToEdit ? "Budget updated successfully" : "Budget added successfully");
      setRefreshData((previousValue) => previousValue + 1);
    } catch (error) {
      console.error(
        budgetToEdit ? "Error updating budget:" : "Error adding budget:",
        error.response?.data?.message || error.message
      );
      if (error.response?.status === 409) {
        setBudgetFormError(error.response?.data?.message || "A budget already exists for this category.");
      } else {
        toast.error(error.response?.data?.message || "Unable to save budget.");
      }
    }
  };

  const handleDeleteBudget = async () => {
    try {
      await axiosInstance.delete(API_PATHS.BUDGET.DELETE(budgetToDelete._id));
      setBudgetToDelete(null);
      setOpenMenuId(null);
      toast.success("Budget deleted successfully");
      setRefreshData((previousValue) => previousValue + 1);
    } catch (error) {
      console.error("Error deleting budget:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Unable to delete budget.");
    }
  };

  const getProgressColor = (percentUsed) => {
    if (percentUsed >= 100) return "bg-red-500";
    if (percentUsed >= 80) return "bg-orange-500";
    return "bg-purple-600";
  };

  const overallLimit = budgets.reduce((total, item) => total + Number(item.monthlyLimit || 0), 0);
  const overallSpent = budgets.reduce((total, item) => total + Number(item.spent || 0), 0);
  const overallPercentUsed = overallLimit ? (overallSpent / overallLimit) * 100 : 0;
  const overallRemaining = Math.max(overallLimit - overallSpent, 0);

  const renderBudgetCard = (item) => {
    const category = expenseCategories.find((entry) => entry.name === item.category);
    const categoryLabel = getCategoryLabel(item);
    const percentUsed = Number(item.percentUsed || 0);
    const progressWidth = Math.min(percentUsed, 100);

    return (
      <div key={item._id} className="group relative card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center text-2xl bg-purple-50 rounded-full">
              {category?.icon || "📦"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="text-base font-medium text-gray-800">{categoryLabel}</h5>
                {item.customCategory && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Monthly budget</p>
            </div>
          </div>
          <div className="relative">
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                aria-label={`Edit ${categoryLabel} budget`}
                className="text-gray-400 hover:text-purple-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => openEditBudget(item)}
              >
                <LuPencil size={18} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${categoryLabel} budget`}
                className="text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setBudgetToDelete(item)}
              >
                <LuTrash2 size={18} />
              </button>
            </div>
            <button
              type="button"
              aria-label={`More actions for ${categoryLabel} budget`}
              className="sm:hidden text-gray-500 hover:text-purple-600"
              onClick={() => setOpenMenuId(openMenuId === item._id ? null : item._id)}
            >
              <LuEllipsisVertical size={20} />
            </button>
            {openMenuId === item._id && (
              <div className="sm:hidden absolute right-0 top-7 z-10 min-w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  onClick={() => openEditBudget(item)}
                >
                  <LuPencil size={15} /> Edit
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setBudgetToDelete(item);
                    setOpenMenuId(null);
                  }}
                >
                  <LuTrash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">₹{formatAmount(item.spent)}</span>
            <span className="text-gray-400"> / ₹{formatAmount(item.monthlyLimit)}</span>
          </p>
          <p className="text-sm font-medium text-gray-600">{percentUsed.toFixed(0)}% used</p>
        </div>
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-label={`${categoryLabel} budget used`}
          aria-valuenow={Math.min(percentUsed, 100)}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className={`h-full rounded-full transition-all ${getProgressColor(percentUsed)}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          ₹{formatAmount(item.remaining)} remaining
        </p>
      </div>
    );
  };

  return (
    <DashboardLayout activeMenu="Budget">
      <div className="my-5 mx-auto">
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h5 className="text-lg">Monthly Budgets</h5>
              <p className="mt-1 text-xs text-gray-400">Track spending by expense category.</p>
            </div>
            <button
              type="button"
              className="add-btn add-btn-fill"
              onClick={openAddBudget}
            >
              <LuPlus className="text-lg" /> Add Budget
            </button>
          </div>
        </div>

        {loading && <p className="mt-4 text-sm text-gray-400">Loading budgets...</p>}
        {budgets.length > 0 && (
          <div className="card mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h5 className="text-base font-medium text-gray-800">Overall monthly budget</h5>
                <p className="mt-1 text-xs text-gray-400">Combined across your categories</p>
              </div>
              <p className="text-sm font-medium text-gray-600">{overallPercentUsed.toFixed(0)}% used</p>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2 text-sm">
              <p className="text-gray-700">
                <span className="font-semibold">₹{formatAmount(overallSpent)}</span>
                <span className="text-gray-400"> / ₹{formatAmount(overallLimit)}</span>
              </p>
              <p className="text-xs text-gray-500">₹{formatAmount(overallRemaining)} remaining</p>
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-label="Overall monthly budget used"
              aria-valuenow={Math.min(overallPercentUsed, 100)}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(overallPercentUsed)}`}
                style={{ width: `${Math.min(overallPercentUsed, 100)}%` }}
              />
            </div>
          </div>
        )}
        {!loading && budgets.length === 0 && (
          <div className="card mt-6 flex flex-col items-center py-12 text-center">
            <h5 className="text-lg font-medium text-gray-800">No budgets yet</h5>
            <p className="mt-2 text-sm text-gray-500">Set a monthly limit to track category spending.</p>
            <button type="button" className="add-btn add-btn-fill mt-5" onClick={openAddBudget}>
              <LuPlus className="text-lg" /> Add Budget
            </button>
          </div>
        )}
        {budgets.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map(renderBudgetCard)}
          </div>
        )}
      </div>

      <Modal
        isOpen={openBudgetModal}
        onClose={closeBudgetModal}
        title={budgetToEdit ? "Edit Budget" : "Add Budget"}
      >
        <div>
          <label className="text-[13px] text-slate-800">Category</label>
          <select
            className="input-box"
            value={budget.category}
            onChange={({target}) => handleBudgetChange("category", target.value)}
          >
            <option value="" disabled>Select a category</option>
            {availableCategories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {budget.category === "Other" && (
            <>
              <Input
                value={budget.customCategory}
                onChange={({target}) => handleBudgetChange("customCategory", target.value.slice(0, 30))}
                label="Custom name (leave empty for general Other budget)"
                placeholder="e.g. Trip To Goa"
                type="text"
                list="custom-budget-categories"
              />
              <datalist id="custom-budget-categories">
                {customCategories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </>
          )}
          <Input
            value={budget.monthlyLimit}
            onChange={({target}) => handleBudgetChange("monthlyLimit", target.value)}
            label="Monthly limit"
            placeholder="Enter amount"
            type="number"
          />
          {budgetFormError && (
            <p className="mt-2 text-sm text-red-600" role="alert">{budgetFormError}</p>
          )}
          <div className="flex justify-end mt-6">
            <button type="button" className="add-btn add-btn-fill" onClick={handleSaveBudget}>
              {budgetToEdit ? "Update" : "Add Budget"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        title="Delete Budget"
      >
        <DeleteAlert
          content={`Are you sure you want to delete the ${budgetToDelete ? getCategoryLabel(budgetToDelete) : ""} budget?`}
          onDelete={handleDeleteBudget}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default Budget;

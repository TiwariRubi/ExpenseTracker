import React, {useEffect, useState} from 'react'
import { LuArrowRight } from 'react-icons/lu'
import toast from 'react-hot-toast'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import expenseCategories from '../../../../../shared/expenseCategories.json'
import { getCategoryLabel } from '../../../../../shared/categoryHelpers.mjs'

const formatAmount = (amount) => Number(amount || 0).toLocaleString("en-IN")

const BudgetSummary = ({ onSeeAll }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchBudgetStatus = async () => {
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
            "Error fetching dashboard budgets:",
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
  }, []);

  const getProgressColor = (level) => {
    if (level === "exceeded") return "bg-red-500";
    if (level === "warning") return "bg-orange-500";
    return "bg-purple-600";
  };

  const topBudgets = [...budgets]
    .sort((first, second) => second.percentUsed - first.percentUsed)
    .slice(0, 3);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">Budgets</h5>
        <button type="button" className="card-btn" onClick={onSeeAll}>
          See All <LuArrowRight className="text-base" />
        </button>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-gray-400">Loading budgets...</p>
      ) : budgets.length === 0 ? (
        <div className="mt-5">
          <p className="text-sm text-gray-500">No budgets yet.</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-primary hover:underline"
            onClick={onSeeAll}
          >
            Set a budget
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {topBudgets.map((budget) => {
            const category = expenseCategories.find((item) => item.name === budget.category);
            const categoryLabel = getCategoryLabel(budget);
            const percentUsed = Number(budget.percentUsed || 0);
            const progressWidth = Math.min(Math.max(percentUsed, 0), 100);

            return (
              <div key={budget._id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true">{category?.icon || "📦"}</span>
                    <span className="truncate text-sm font-medium text-gray-700">{categoryLabel}</span>
                    {budget.customCategory && (
                      <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                        Custom
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">
                    ₹{formatAmount(budget.spent)} / ₹{formatAmount(budget.monthlyLimit)}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-label={`${categoryLabel} budget used`}
                  aria-valuenow={progressWidth}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    className={`h-full rounded-full ${getProgressColor(budget.level)}`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-gray-400">
                  {percentUsed.toFixed(0)}% used
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;

const Notification = require("../models/Notification");

const IST_OFFSET_MINUTES = 330;

const getISTMonthKey = (date = new Date()) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatAmount = (amount) => Number(amount || 0).toLocaleString("en-IN");

const createNotification = async (userId, payload) => {
  try {
    const notification = new Notification({ userId, ...payload });
    return await notification.save();
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }
};

const notifyBudgetStatus = async (userId, statusItems, date = new Date()) => {
  const statuses = Array.isArray(statusItems)
    ? statusItems
    : statusItems
      ? [statusItems]
      : [];
  const month = getISTMonthKey(date);
  const notifications = statuses
    .filter((status) => ["warning", "exceeded"].includes(status.level))
    .map((status) => {
      const budgetId = String(status._id || status.budgetId);
      const type = status.level === "warning" ? "budget_warning" : "budget_exceeded";
      const label = status.label || status.customCategory || status.category;
      const title = status.level === "warning" ? "Budget warning" : "Budget exceeded";

      return createNotification(userId, {
        type,
        title,
        message: `${label} is at ${Math.round(status.percentUsed)}% of its budget (₹${formatAmount(status.spent)} of ₹${formatAmount(status.limit ?? status.monthlyLimit)})`,
        link: "/budget",
        meta: {
          budgetId,
          category: status.category,
          customCategory: status.customCategory || "",
          month,
        },
        dedupeKey: `budget:${budgetId}:${month}:${status.level}`,
      });
    });

  return Promise.all(notifications);
};

module.exports = {
  createNotification,
  notifyBudgetStatus,
  getISTMonthKey,
};

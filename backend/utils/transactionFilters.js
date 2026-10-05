const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value ? date : null;
};

const parseAmount = (value) => {
  if (typeof value !== "string" || !/^(?:\d+\.?\d*|\.\d+)$/.test(value)) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const invalidFilter = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const buildTransactionFilters = (userId, params, searchFields, categoryField) => {
  const filters = { userId };
  const { search, category, from, to, minAmount, maxAmount } = params;
  const conditions = [];

  if (search !== undefined && search !== "") {
    if (typeof search !== "string" || search.length > 100) {
      throw invalidFilter("Search must be 100 characters or fewer");
    }

    const searchRegex = { $regex: escapeRegex(search), $options: "i" };
    conditions.push({
      $or: searchFields.map((field) => ({ [field]: searchRegex })),
    });
  }

  if (category !== undefined && category !== "") {
    if (typeof category !== "string" || category.length > 100) {
      throw invalidFilter("Invalid category filter");
    }

    conditions.push({ [categoryField]: category });
  }

  if (conditions.length) {
    filters.$and = conditions;
  }

  if (from !== undefined && from !== "") {
    const fromDate = parseDate(from);
    if (!fromDate) {
      throw invalidFilter("Invalid start date");
    }
    filters.date = { ...filters.date, $gte: fromDate };
  }

  if (to !== undefined && to !== "") {
    const toDate = parseDate(to);
    if (!toDate) {
      throw invalidFilter("Invalid end date");
    }
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    filters.date = { ...filters.date, $lt: toDate };
  }

  const amount = {};
  if (minAmount !== undefined && minAmount !== "") {
    amount.$gte = parseAmount(minAmount);
    if (amount.$gte === null) {
      throw invalidFilter("Invalid minimum amount");
    }
  }

  if (maxAmount !== undefined && maxAmount !== "") {
    amount.$lte = parseAmount(maxAmount);
    if (amount.$lte === null) {
      throw invalidFilter("Invalid maximum amount");
    }
  }

  if (amount.$gte !== undefined && amount.$lte !== undefined && amount.$gte > amount.$lte) {
    throw invalidFilter("Minimum amount cannot exceed maximum amount");
  }

  if (Object.keys(amount).length) {
    filters.amount = amount;
  }

  return filters;
};

module.exports = buildTransactionFilters;

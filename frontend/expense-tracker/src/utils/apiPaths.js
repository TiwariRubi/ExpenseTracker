export const BASE_URL = "http://localhost:8000";

// utils/apiPaths.js
export const API_PATHS ={
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    GET_USER_INFO: "/api/v1/auth/getUser",
  },
  DASHBOARD: {
    GET_DATA: "/api/v1/dashboard",
  },
  INCOME: {
    ADD_INCOME: "/api/v1/income/add",
    GET_ALL_INCOME: "/api/v1/income/get",
    GET_INCOME_SOURCE_SUGGESTIONS: "/api/v1/income/source-suggestions",
    UPDATE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
    DELETE_INCOME: (incomeId)=> `/api/v1/income/${incomeId}` ,
    DOWNLOAD_INCOME: `/api/v1/income/downloadexcel`,


  },
  EXPENSE: {
    ADD_EXPENSE: "/api/v1/expense/add",
    GET_ALL_EXPENSE: "/api/v1/expense/get",
    GET_CUSTOM_EXPENSE_CATEGORIES: "/api/v1/expense/custom-categories",
    UPDATE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
    DELETE_EXPENSE: (expenseId) =>`/api/v1/expense/${expenseId}` ,
    DOWNLOAD_EXPENSE: `/api/v1/expense/downloadexcel` ,
  },
  BUDGET: {
    GET_ALL: "/api/v1/budget",
    GET_STATUS: "/api/v1/budget/status",
    ADD: "/api/v1/budget",
    UPDATE: (budgetId) => `/api/v1/budget/${budgetId}`,
    DELETE: (budgetId) => `/api/v1/budget/${budgetId}`,
  },
  NOTIFICATION: {
    GET_ALL: "/api/v1/notifications",
    GET_UNREAD_COUNT: "/api/v1/notifications/unread-count",
    MARK_ALL_READ: "/api/v1/notifications/read-all",
    CLEAR_READ: "/api/v1/notifications/clear",
    MARK_READ: (notificationId) => `/api/v1/notifications/${notificationId}/read`,
    DELETE: (notificationId) => `/api/v1/notifications/${notificationId}`,
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/v1/auth/upload-image",
  },
}
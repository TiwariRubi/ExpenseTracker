import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../context/UserContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const NotificationsContext = createContext(null);

const useNotificationState = () => {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const lastUnreadCount = useRef(null);
  const knownNotificationIds = useRef(new Set());
  const pollingInProgress = useRef(false);
  const isAuthenticated = Boolean(user && localStorage.getItem("token"));

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axiosInstance.get(API_PATHS.NOTIFICATION.GET_UNREAD_COUNT);
      setUnreadCount(response.data.count);
      lastUnreadCount.current = response.data.count;
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load unread notifications."));
      throw requestError;
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async (unreadOnly = false) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.NOTIFICATION.GET_ALL, {
        params: { limit: 20, skip: 0, unread: unreadOnly ? "true" : undefined },
      });
      if (!Array.isArray(response.data?.notifications)) {
        throw new Error("Invalid notifications response");
      }
      setNotifications(response.data.notifications);
      setTotal(response.data.total);
      response.data.notifications.forEach((notification) =>
        knownNotificationIds.current.add(notification._id)
      );
      setError("");
      await refreshUnreadCount();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load notifications."));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshUnreadCount]);

  const updateNotification = useCallback(async (notificationId, action) => {
    if (!isAuthenticated) return;

    try {
      await action();
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      const response = await axiosInstance.get(API_PATHS.NOTIFICATION.GET_UNREAD_COUNT);
      setUnreadCount(response.data.count);
      lastUnreadCount.current = response.data.count;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update notification."));
      throw requestError;
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback((notificationId) =>
    updateNotification(notificationId, () =>
      axiosInstance.patch(API_PATHS.NOTIFICATION.MARK_READ(notificationId))
    ), [updateNotification]);

  const loadMoreNotifications = useCallback(async (unreadOnly = false) => {
    if (!isAuthenticated || loading || notifications.length >= total) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.NOTIFICATION.GET_ALL, {
        params: {
          limit: 20,
          skip: notifications.length,
          unread: unreadOnly ? "true" : undefined,
        },
      });
      if (!Array.isArray(response.data?.notifications)) {
        throw new Error("Invalid notifications response");
      }
      setNotifications((previousNotifications) => [
        ...previousNotifications,
        ...response.data.notifications,
      ]);
      response.data.notifications.forEach((notification) =>
        knownNotificationIds.current.add(notification._id)
      );
      setTotal(response.data.total);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load more notifications."));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loading, notifications.length, total]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await axiosInstance.patch(API_PATHS.NOTIFICATION.MARK_ALL_READ);
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      lastUnreadCount.current = 0;
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to mark notifications as read."));
      throw requestError;
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    const deletedNotification = notifications.find((notification) => notification._id === notificationId);
    try {
      await axiosInstance.delete(API_PATHS.NOTIFICATION.DELETE(notificationId));
      setNotifications((previousNotifications) =>
        previousNotifications.filter((notification) => notification._id !== notificationId)
      );
      setTotal((previousTotal) => Math.max(previousTotal - 1, 0));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((previousCount) => {
          const count = Math.max(previousCount - 1, 0);
          lastUnreadCount.current = count;
          return count;
        });
      }
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to delete notification."));
      throw requestError;
    }
  }, [isAuthenticated, notifications]);

  const clearReadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axiosInstance.delete(API_PATHS.NOTIFICATION.CLEAR_READ);
      setNotifications((previousNotifications) =>
        previousNotifications.filter((notification) => !notification.isRead)
      );
      setTotal((previousTotal) => Math.max(previousTotal - response.data.deletedCount, 0));
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to clear read notifications."));
      throw requestError;
    }
  }, [isAuthenticated]);

  const pollUnreadCount = useCallback(async () => {
    if (!isAuthenticated || document.visibilityState !== "visible" || pollingInProgress.current) return;

    pollingInProgress.current = true;
    try {
      const response = await axiosInstance.get(API_PATHS.NOTIFICATION.GET_UNREAD_COUNT);
      const count = response.data.count;
      setUnreadCount(count);
      setError("");

      const isFirstPoll = lastUnreadCount.current === null;
      const hasNewUnreadNotifications = !isFirstPoll && count > lastUnreadCount.current;

      if (isFirstPoll || hasNewUnreadNotifications) {
        const listResponse = await axiosInstance.get(API_PATHS.NOTIFICATION.GET_ALL, {
          params: { limit: 100, skip: 0 },
        });
        if (!Array.isArray(listResponse.data?.notifications)) {
          throw new Error("Invalid notifications response");
        }

        const newNotifications = listResponse.data.notifications.filter((notification) => {
          if (knownNotificationIds.current.has(notification._id)) return false;
          knownNotificationIds.current.add(notification._id);
          return hasNewUnreadNotifications && !notification.isRead;
        });
        const toasts = newNotifications.slice(0, 3);
        toasts.forEach((notification) => {
          const isExceeded = notification.type === "budget_exceeded";
          toast(notification.message, {
            icon: isExceeded ? "🚨" : notification.type === "budget_warning" ? "⚠️" : "🔔",
            style: {
              fontSize: "14px",
              fontWeight: 600,
              padding: "14px 18px",
              border: `1px solid ${isExceeded ? "#ef4444" : "#f59e0b"}`,
            },
          });
        });
        if (newNotifications.length > 3) {
          toast(`and ${newNotifications.length - 3} more notifications`, { icon: "🔔" });
        }
      }
      lastUnreadCount.current = count;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to refresh notifications."));
    } finally {
      pollingInProgress.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      setLoading(false);
      setError("");
      lastUnreadCount.current = null;
      knownNotificationIds.current.clear();
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pollUnreadCount();
      }
    };

    pollUnreadCount();
    const intervalId = window.setInterval(pollUnreadCount, 30000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, pollUnreadCount]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    isAuthenticated,
    refreshNotifications,
    loadMoreNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  };
};

export const NotificationsProvider = ({ children }) => (
  <NotificationsContext.Provider value={useNotificationState()}>
    {children}
  </NotificationsContext.Provider>
);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
};

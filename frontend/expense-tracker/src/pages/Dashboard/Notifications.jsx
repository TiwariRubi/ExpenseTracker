import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBell, LuCheckCheck, LuCircleAlert, LuTriangleAlert, LuX } from "react-icons/lu";
import moment from "moment";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNotifications } from "../../hooks/useNotifications";

const Notifications = () => {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();
  const unreadOnly = filter === "unread";

  useEffect(() => {
    refreshNotifications(unreadOnly).catch(() => {});
  }, [refreshNotifications, unreadOnly]);

  const handleAction = async (action) => {
    try {
      await action();
      if (unreadOnly) await refreshNotifications(true);
    } catch {
      toast.error("Unable to update notifications.");
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) await markAsRead(notification._id);
      navigate(notification.link || "/budget");
    } catch {
      toast.error("Unable to open notification.");
    }
  };

  const getNotificationStyle = (type) => {
    if (type === "budget_exceeded") {
      return { icon: <LuTriangleAlert />, color: "text-red-500", background: "bg-red-50" };
    }
    if (type === "budget_warning") {
      return { icon: <LuCircleAlert />, color: "text-orange-500", background: "bg-orange-50" };
    }
    return { icon: <LuBell />, color: "text-purple-600", background: "bg-purple-50" };
  };

  return (
    <DashboardLayout activeMenu="Notifications">
      <div className="my-5 mx-auto max-w-4xl">
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h5 className="text-lg font-medium text-gray-800">Notifications</h5>
              <p className="mt-1 text-xs text-gray-400">Stay up to date with your budget alerts.</p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800"
                  onClick={() => handleAction(markAllAsRead)}
                >
                  <LuCheckCheck size={16} /> Mark all as read
                </button>
              )}
              {notifications.some((notification) => notification.isRead) && (
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-red-500"
                  onClick={() => handleAction(clearReadNotifications)}
                >
                  Clear read
                </button>
              )}
            </div>
          </div>
          <div className="mt-5 flex gap-2 border-b border-gray-100">
            {["all", "unread"].map((value) => (
              <button
                key={value}
                type="button"
                className={`border-b-2 px-3 py-2 text-sm capitalize ${filter === value ? "border-purple-600 font-medium text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="mt-1 font-medium underline"
                onClick={() => refreshNotifications(unreadOnly).catch(() => {})}
              >
                Try again
              </button>
            </div>
          )}

          {loading && notifications.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            !error && <p className="py-12 text-center text-sm text-gray-500">You're all caught up</p>
          ) : (
            <div className="mt-2 divide-y divide-gray-100">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                return (
                  <div
                    key={notification._id}
                    className={`flex items-start gap-3 px-2 py-4 sm:px-3 ${notification.isRead ? "" : "bg-purple-50/40"}`}
                  >
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.color} ${style.background}`}>
                      {style.icon}
                    </div>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{notification.title}</span>
                        {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-purple-600" />}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-gray-600">{notification.message}</span>
                      <span className="mt-1 block text-xs text-gray-400">{moment(notification.createdAt).fromNow()}</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete notification"
                      className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      onClick={() => handleAction(() => deleteNotification(notification._id))}
                    >
                      <LuX size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {notifications.length < total && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="add-btn"
                disabled={loading}
                onClick={() => loadMoreNotifications(unreadOnly).catch(() => {})}
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;

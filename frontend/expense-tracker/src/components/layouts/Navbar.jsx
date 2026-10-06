import React, {useEffect, useRef, useState} from 'react';
import { LuBell, LuCheckCheck, LuCircleAlert, LuTriangleAlert, LuX } from "react-icons/lu";
import { HiOutlineMenu, HiOutlineX} from "react-icons/hi";
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';
import { useNotifications } from '../../hooks/useNotifications';

const Navbar = ({activeMenu}) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isAuthenticated,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();

  useEffect(() => {
    if (!openNotifications) return;

    const handleOutsideClick = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setOpenNotifications(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenNotifications(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openNotifications]);

  const toggleNotifications = () => {
    const shouldOpen = !openNotifications;
    setOpenNotifications(shouldOpen);
    if (shouldOpen) refreshNotifications().catch(() => {});
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) await markAsRead(notification._id);
      setOpenNotifications(false);
      navigate(notification.link || "/budget");
    } catch {
      // The hook displays the request error in the dropdown.
    }
  };

  const handleNotificationAction = async (action) => {
    try {
      await action();
    } catch {
      // The hook displays the request error in the dropdown.
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

  return(
   <div className="flex gap-5 bg-white border boredr-b border-gray-200/50 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30">
    <button
      className="block lg:hidden text-black"
      onClick={() => {
        setOpenSideMenu(!openSideMenu);
      }}
    >
      {openSideMenu ? (
        <HiOutlineX className="text-2xl" />
      ) : (
      <HiOutlineMenu className="text-2xl" />
      )}

    </button>
    <h2 className="text-lg font-medium text-black">Expense Tracker</h2>
    {isAuthenticated && (
      <div className="relative ml-auto" ref={notificationsRef}>
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={openNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-purple-700 hover:bg-purple-50"
          onClick={toggleNotifications}
        >
          <LuBell className="text-xl" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-purple-600 px-1 text-center text-[10px] font-semibold leading-5 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {openNotifications && (
          <div className="fixed left-2 right-2 top-[61px] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800"
                  onClick={() => handleNotificationAction(markAllAsRead)}
                >
                  <LuCheckCheck size={15} /> Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[min(65vh,30rem)] overflow-y-auto">
              {error && (
                <div className="px-4 py-3 text-sm text-red-600" role="alert">
                  <p>{error}</p>
                  <button
                    type="button"
                    className="mt-1 font-medium underline"
                    onClick={() => handleNotificationAction(refreshNotifications)}
                  >
                    Try again
                  </button>
                </div>
              )}
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                !error && <p className="px-4 py-8 text-center text-sm text-gray-500">You're all caught up</p>
              ) : (
                notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  return (
                    <div
                      key={notification._id}
                      className={`flex items-start gap-3 border-b border-gray-100 px-4 py-3 ${notification.isRead ? "bg-white" : "bg-purple-50/40"}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.color} ${style.background}`}>
                        {style.icon}
                      </div>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-gray-800">{notification.title}</span>
                          {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-purple-600" />}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-gray-600">{notification.message}</span>
                        <span className="mt-1 block text-[11px] text-gray-400">
                          {moment(notification.createdAt).fromNow()}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete notification"
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        onClick={() => handleNotificationAction(() => deleteNotification(notification._id))}
                      >
                        <LuX size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {notifications.some((notification) => notification.isRead) && (
              <div className="border-t border-gray-100 px-4 py-2 text-right">
                <button
                  type="button"
                  className="text-xs font-medium text-gray-500 hover:text-red-500"
                  onClick={() => handleNotificationAction(clearReadNotifications)}
                >
                  Clear read
                </button>
              </div>
            )}
            <div className="border-t border-gray-100 px-4 py-3 text-center">
              <button
                type="button"
                className="text-sm font-medium text-purple-600 hover:text-purple-800"
                onClick={() => {
                  setOpenNotifications(false);
                  navigate("/notifications");
                }}
              >
                See all notifications
              </button>
            </div>
          </div>
        )}
      </div>
    )}

    {openSideMenu && (
      <div className="fixed top-[61px] -ml-4 bg-white">
        <SideMenu activeMenu={activeMenu} />
        </div>
    )}
   </div>
  )

}

export default Navbar
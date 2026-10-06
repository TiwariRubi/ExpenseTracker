const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllNotificationsAsRead);
router.delete("/clear", protect, clearReadNotifications);
router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;

const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const getPagination = (query) => {
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const skip = query.skip === undefined ? 0 : Number(query.skip);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isInteger(skip) || skip < 0) {
    return { error: "Limit must be 1-100 and skip must be 0 or greater" };
  }

  return { limit, skip };
};

exports.getNotifications = async (req, res) => {
  const pagination = getPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ message: pagination.error });
  }
  if (req.query.unread !== undefined && !["true", "false"].includes(req.query.unread)) {
    return res.status(400).json({ message: "Unread filter must be true or false" });
  }

  try {
    const filter = { userId: req.user.id };
    if (req.query.unread === "true") filter.isRead = false;
    if (req.query.unread === "false") filter.isRead = true;
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      notifications,
      total,
      limit: pagination.limit,
      skip: pagination.skip,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification id" });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Notifications marked as read", modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification id" });
  }

  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.id,
      isRead: true,
    });
    res.json({ message: "Read notifications cleared", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

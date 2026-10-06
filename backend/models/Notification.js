const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  type: {
    type: String,
    required: true,
    enum: ["budget_warning", "budget_exceeded", "system"],
  },
  title: {type: String, required: true, trim: true},
  message: {type: String, required: true, trim: true},
  link: {type: String, required: true, trim: true},
  isRead: {type: Boolean, default: false},
  meta: {type: mongoose.Schema.Types.Mixed},
  dedupeKey: {type: String, trim: true},
}, {
  timestamps: {createdAt: true, updatedAt: false},
});

NotificationSchema.index({userId:  1, isRead: 1, createdAt: -1});
NotificationSchema.index(
  {userId: 1, dedupeKey: 1},
  {
    unique: true,
    partialFilterExpression: {dedupeKey: {$type: "string", $gt: ""}},
  }
);
NotificationSchema.index({createdAt: 1}, {expireAfterSeconds: 60 * 60 * 24 * 60});

module.exports = mongoose.model("Notification", NotificationSchema);

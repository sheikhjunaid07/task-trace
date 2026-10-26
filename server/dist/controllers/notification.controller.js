"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const Notification_1 = require("../models/Notification");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getUserNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await Notification_1.Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("sender", "name email avatar")
        .populate("board", "name title description")
        .populate("task", "title")
        .populate({
        path: "invitation",
        populate: { path: "board", select: "name title description" },
    });
    const unreadCount = await Notification_1.Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
    });
    res.json(new ApiResponse_1.ApiResponse(200, "Notifications fetched", {
        notifications,
        unreadCount,
    }));
});
exports.markAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await Notification_1.Notification.findById(notificationId);
    if (!notification)
        throw new ApiError_1.ApiError(404, "Notification not found");
    if (String(notification.recipient) !== String(req.user._id)) {
        throw new ApiError_1.ApiError(403, "You can only update your own notifications");
    }
    notification.isRead = true;
    await notification.save();
    res.json(new ApiResponse_1.ApiResponse(200, "Notification marked as read", notification));
});
exports.markAllAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await Notification_1.Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
    res.json(new ApiResponse_1.ApiResponse(200, "All notifications marked as read", null));
});
exports.deleteNotification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { notificationId } = req.params;
    await Notification_1.Notification.findOneAndDelete({
        _id: notificationId,
        recipient: req.user._id,
    });
    res.json(new ApiResponse_1.ApiResponse(200, "Notification deleted", null));
});
exports.clearAllNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await Notification_1.Notification.deleteMany({ recipient: req.user._id });
    res.json(new ApiResponse_1.ApiResponse(200, "All notifications cleared", null));
});
//# sourceMappingURL=notification.controller.js.map
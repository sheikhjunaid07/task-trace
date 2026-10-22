import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ recipient: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("sender", "name email avatar")
    .populate("board", "name title description")
    .populate("task", "title")
    .populate({
      path: "invitation",
      populate: { path: "board", select: "name title description" },
    });

  const unreadCount = await Notification.countDocuments({
    recipient: req.user!._id,
    isRead: false,
  });

  res.json(
    new ApiResponse(200, "Notifications fetched", {
      notifications,
      unreadCount,
    })
  );
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) throw new ApiError(404, "Notification not found");

  if (String(notification.recipient) !== String(req.user!._id)) {
    throw new ApiError(403, "You can only update your own notifications");
  }

  notification.isRead = true;
  await notification.save();

  res.json(new ApiResponse(200, "Notification marked as read", notification));
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { recipient: req.user!._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json(new ApiResponse(200, "All notifications marked as read", null));
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user!._id,
  });

  res.json(new ApiResponse(200, "Notification deleted", null));
});

export const clearAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  await Notification.deleteMany({ recipient: req.user!._id });
  res.json(new ApiResponse(200, "All notifications cleared", null));
});

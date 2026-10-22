import { Types } from "mongoose";
import { Notification, NotificationType } from "../models/Notification";
import { io } from "../sockets";

export interface CreateNotificationParams {
  recipientId: Types.ObjectId | string;
  senderId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  boardId?: Types.ObjectId | string;
  taskId?: Types.ObjectId | string;
  invitationId?: Types.ObjectId | string;
}

export class NotificationService {
  /**
   * Creates a notification in the database, populates metadata, and emits it live over Socket.IO
   */
  static async send(params: CreateNotificationParams) {
    try {
      const notif = await Notification.create({
        recipient: new Types.ObjectId(String(params.recipientId)),
        sender: new Types.ObjectId(String(params.senderId)),
        type: params.type,
        title: params.title,
        message: params.message,
        board: params.boardId ? new Types.ObjectId(String(params.boardId)) : undefined,
        task: params.taskId ? new Types.ObjectId(String(params.taskId)) : undefined,
        invitation: params.invitationId ? new Types.ObjectId(String(params.invitationId)) : undefined,
        isRead: false,
      });

      await notif.populate([
        { path: "sender", select: "name email avatar" },
        { path: "board", select: "name title description" },
        { path: "task", select: "title" },
      ]);

      if (io) {
        io.to(`user:${String(params.recipientId)}`).emit("notification:new", notif);
      }

      return notif;
    } catch (error) {
      console.error("[NotificationService] Failed to send notification:", error);
      return null;
    }
  }

  /**
   * Helper to send notification to multiple recipients (e.g. board members)
   */
  static async sendToMany(
    recipientIds: Array<Types.ObjectId | string>,
    params: Omit<CreateNotificationParams, "recipientId">
  ) {
    const uniqueIds = Array.from(new Set(recipientIds.map((id) => String(id))));
    return Promise.all(
      uniqueIds.map((rId) =>
        this.send({
          ...params,
          recipientId: rId,
        })
      )
    );
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = require("mongoose");
const Notification_1 = require("../models/Notification");
const sockets_1 = require("../sockets");
class NotificationService {
    /**
     * Creates a notification in the database, populates metadata, and emits it live over Socket.IO
     */
    static async send(params) {
        try {
            const notif = await Notification_1.Notification.create({
                recipient: new mongoose_1.Types.ObjectId(String(params.recipientId)),
                sender: new mongoose_1.Types.ObjectId(String(params.senderId)),
                type: params.type,
                title: params.title,
                message: params.message,
                board: params.boardId ? new mongoose_1.Types.ObjectId(String(params.boardId)) : undefined,
                task: params.taskId ? new mongoose_1.Types.ObjectId(String(params.taskId)) : undefined,
                invitation: params.invitationId ? new mongoose_1.Types.ObjectId(String(params.invitationId)) : undefined,
                isRead: false,
            });
            await notif.populate([
                { path: "sender", select: "name email avatar" },
                { path: "board", select: "name title description" },
                { path: "task", select: "title" },
            ]);
            if (sockets_1.io) {
                sockets_1.io.to(`user:${String(params.recipientId)}`).emit("notification:new", notif);
            }
            return notif;
        }
        catch (error) {
            console.error("[NotificationService] Failed to send notification:", error);
            return null;
        }
    }
    /**
     * Helper to send notification to multiple recipients (e.g. board members)
     */
    static async sendToMany(recipientIds, params) {
        const uniqueIds = Array.from(new Set(recipientIds.map((id) => String(id))));
        return Promise.all(uniqueIds.map((rId) => this.send({
            ...params,
            recipientId: rId,
        })));
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map
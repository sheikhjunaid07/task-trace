import mongoose, { Schema, Types } from "mongoose";

export type NotificationType =
  | "BOARD_INVITATION"
  | "TASK_MENTION"
  | "PROJECT_CREATED"
  | "TASK_CREATED"
  | "TASK_MOVED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "PROJECT_DELETED"
  | "MEMBER_JOINED"
  | "GENERAL";

export interface INotification {
  _id?: Types.ObjectId;
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  board?: Types.ObjectId;
  task?: Types.ObjectId;
  invitation?: Types.ObjectId;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "BOARD_INVITATION",
        "TASK_MENTION",
        "PROJECT_CREATED",
        "TASK_CREATED",
        "TASK_MOVED",
        "TASK_UPDATED",
        "TASK_DELETED",
        "PROJECT_DELETED",
        "MEMBER_JOINED",
        "GENERAL",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    board: { type: Schema.Types.ObjectId, ref: "Board" },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    invitation: { type: Schema.Types.ObjectId, ref: "Invitation" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);

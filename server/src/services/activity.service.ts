import { Types } from "mongoose";
import { Activity, IActivity } from "../models/Activity";

export type ActivityType =
  | "BOARD_CREATED"
  | "BOARD_UPDATED"
  | "BOARD_DELETED"
  | "COLUMN_ADDED"
  | "COLUMN_RENAMED"
  | "COLUMN_DELETED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_UPDATED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_MOVED"
  | "TASK_DELETED"
  | "TASK_ARCHIVED"
  | "TASK_RESTORED"
  | "COMMENT_ADDED"
  | "COMMENT_UPDATED"
  | "COMMENT_DELETED";

export class ActivityService {
  static async log(
    userId: Types.ObjectId | string,
    boardId: Types.ObjectId | string,
    type: ActivityType,
    message: string,
    metadata: Record<string, unknown> = {},
    taskId?: Types.ObjectId | string,
  ): Promise<IActivity> {
    const activity = await Activity.create({
      user: userId as Types.ObjectId,
      board: boardId as Types.ObjectId,
      task: taskId ? (taskId as Types.ObjectId) : undefined,
      type,
      message,
      metadata,
    });
    return activity;
  }

  static async getBoardActivity(
    boardId: Types.ObjectId | string,
    limit = 50,
  ): Promise<IActivity[]> {
    return Activity.find({ board: boardId as Types.ObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "name email avatar")
      .populate("task", "title");
  }
}

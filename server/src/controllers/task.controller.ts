import { Request, Response } from "express";
import { Types } from "mongoose";
import { Board, IBoard } from "../models/Board";
import { Comment } from "../models/Comment";
import { Notification } from "../models/Notification";
import { ITask, Task } from "../models/Task";
import { ActivityService } from "../services/activity.service";
import { NotificationService } from "../services/notification.service";
import { TaskService } from "../services/task.service";
import { io } from "../sockets";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { idOf } from "../utils/idOf";
import { idempotencyStore } from "../utils/idempotency";

const uid = (req: Request): string => String(req.user!._id);

const assertBoardAccess = (board: IBoard, userId: string): void => {
  const isOwner = idOf(board.owner) === userId;
  const isMember = board.members.some((member) => idOf(member) === userId);
  if (!isOwner && !isMember) {
    throw new ApiError(403, "You do not have access to this board");
  }
};

const handleTaskMentions = async (task: any, description?: string, senderUser?: any) => {
  if (!description || !senderUser) return;

  const board = await Board.findById(task.board).populate("members", "name email avatar");
  if (!board) return;

  const allMembers = [board.owner, ...board.members];
  const mentionedUserIds = new Set<string>();

  for (const member of allMembers) {
    const m = member as any;
    if (!m || String(m._id) === String(senderUser._id)) continue;

    const nameMatch = description.toLowerCase().includes(`@${m.name.toLowerCase()}`);
    const idMatch = description.includes(String(m._id));

    if (nameMatch || idMatch) {
      mentionedUserIds.add(String(m._id));
    }
  }

  for (const recipientId of mentionedUserIds) {
    const notif = await Notification.create({
      recipient: new Types.ObjectId(recipientId),
      sender: senderUser._id,
      type: "TASK_MENTION",
      title: "You were mentioned in a task",
      message: `${senderUser.name} mentioned you in task "${task.title}"`,
      board: task.board,
      task: task._id,
    });

    await notif.populate([
      { path: "sender", select: "name email avatar" },
      { path: "board", select: "name title description" },
      { path: "task", select: "title" },
    ]);

    io.to(`user:${recipientId}`).emit("notification:new", notif);
  }
};

export const getBoardTasks = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const tasks = await Task.find({ board: boardId, isArchived: { $ne: true } })
    .sort({ position: 1, _id: 1 })
    .populate("assignees", "name email avatar");

  const taskIds = tasks.map((t) => t._id);
  const commentCounts = await Comment.aggregate([
    { $match: { task: { $in: taskIds } } },
    { $group: { _id: "$task", count: { $sum: 1 } } },
  ]);
  const commentCountMap = new Map(commentCounts.map((c) => [String(c._id), c.count]));

  const tasksWithCounts = tasks.map((t) => {
    const doc = t.toObject();
    return {
      ...doc,
      commentCount: commentCountMap.get(String(t._id)) || 0,
    };
  });

  res.json(new ApiResponse(200, "Tasks fetched", tasksWithCounts));
});

export const getColumnTasks = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const tasks = await Task.find({ board: boardId, columnId, isArchived: { $ne: true } })
    .sort({ position: 1, _id: 1 })
    .populate("assignees", "name email avatar");

  const taskIds = tasks.map((t) => t._id);
  const commentCounts = await Comment.aggregate([
    { $match: { task: { $in: taskIds } } },
    { $group: { _id: "$task", count: { $sum: 1 } } },
  ]);
  const commentCountMap = new Map(commentCounts.map((c) => [String(c._id), c.count]));

  const tasksWithCounts = tasks.map((t) => {
    const doc = t.toObject();
    return {
      ...doc,
      commentCount: commentCountMap.get(String(t._id)) || 0,
    };
  });

  res.json(new ApiResponse(200, "Tasks fetched", tasksWithCounts));
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;
  const { opId } = req.body as { opId?: string };

  if (opId) {
    const cached = idempotencyStore.get(opId);
    if (cached) {
      return res.status(cached.statusCode).json(cached.data);
    }
  }

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  if (!board.columns.some((c) => String(c._id) === columnId)) {
    throw new ApiError(400, "Column does not exist on this board");
  }
  assertBoardAccess(board, uid(req));

  const position = await TaskService.getNextPosition(boardId, columnId);
  const task = await Task.create({
    ...req.body,
    board: new Types.ObjectId(boardId),
    columnId: new Types.ObjectId(columnId),
    position,
    version: 1,
    createdBy: req.user!._id,
  } as Partial<ITask>);

  await task.populate("assignees", "name email avatar");

  await handleTaskMentions(task, req.body.description, req.user);

  await ActivityService.log(
    req.user!._id,
    boardId,
    "TASK_CREATED",
    `created task "${task.title}"`,
    { taskId: String(task._id) },
    String(task._id)
  );

  io.to(`board:${boardId}`).emit("task:created", {
    boardId,
    taskId: String(task._id),
    task,
    actorId: uid(req),
    opId,
  });

  const targetCol = board.columns.find((c) => String(c._id) === columnId);
  const targetColName = targetCol ? targetCol.name : "board";

  await NotificationService.send({
    recipientId: req.user!._id,
    senderId: req.user!._id,
    type: "TASK_CREATED",
    title: "Task Created",
    message: `Created task "${task.title}" in ${targetColName}`,
    boardId: board._id,
    taskId: task._id,
  });

  const otherMemberIds = [board.owner, ...board.members]
    .map((m) => String((m as any)._id || m))
    .filter((id) => id !== uid(req));

  if (otherMemberIds.length > 0) {
    await NotificationService.sendToMany(otherMemberIds, {
      senderId: req.user!._id,
      type: "TASK_CREATED",
      title: "New Task Added",
      message: `${req.user!.name} created task "${task.title}" in ${targetColName}`,
      boardId: board._id,
      taskId: task._id,
    });
  }

  const response = new ApiResponse(201, "Task created", task);
  if (opId) {
    idempotencyStore.set(opId, 201, response);
  }

  res.status(201).json(response);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { opId, version } = req.body as { opId?: string; version?: number };

  if (opId) {
    const cached = idempotencyStore.get(opId);
    if (cached) {
      return res.status(cached.statusCode).json(cached.data);
    }
  }

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const board = await Board.findById(task.board);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  // Optimistic concurrency control: detect simultaneous update conflict
  if (typeof version === "number" && task.version !== undefined && task.version !== version) {
    await task.populate("assignees", "name email avatar");
    return res.status(409).json(new ApiResponse(409, "VERSION_CONFLICT", task));
  }

  const { title, description, labels, dueDate, assignees, priority } = req.body as {
    title?: string;
    description?: string;
    labels?: string[];
    dueDate?: Date | null;
    assignees?: string[];
    priority?: "low" | "medium" | "high" | "critical";
  };

  const changedFields: string[] = [];
  if (title !== undefined && title !== task.title) {
    task.title = title;
    changedFields.push("title");
  }
  if (description !== undefined && description !== task.description) {
    task.description = description;
    changedFields.push("description");
  }
  if (priority !== undefined && priority !== task.priority) {
    task.priority = priority;
    changedFields.push("priority");
  }
  if (labels !== undefined) {
    task.labels = labels;
    changedFields.push("labels");
  }
  if (dueDate !== undefined) {
    task.dueDate = dueDate;
    changedFields.push("dueDate");
  }
  if (assignees !== undefined) {
    task.assignees = assignees.map((a) => new Types.ObjectId(a));
    changedFields.push("assignees");
  }

  task.version = (task.version || 1) + 1;
  await task.save();
  await task.populate("assignees", "name email avatar");

  if (description) {
    await handleTaskMentions(task, description, req.user);
  }

  await ActivityService.log(
    req.user!._id,
    String(task.board),
    "TASK_UPDATED",
    `updated task "${task.title}"`,
    { taskId: String(task._id), changedFields },
    String(task._id)
  );

  io.to(`board:${String(task.board)}`).emit("task:updated", {
    boardId: String(task.board),
    taskId: String(task._id),
    task,
    changedFields,
    actorId: uid(req),
    opId,
    version: task.version,
  });

  const changesDesc = changedFields.length > 0 ? changedFields.join(", ") : "details";
  await NotificationService.send({
    recipientId: req.user!._id,
    senderId: req.user!._id,
    type: "TASK_UPDATED",
    title: "Task Updated",
    message: `Updated task "${task.title}" (${changesDesc})`,
    boardId: task.board,
    taskId: task._id,
  });

  const response = new ApiResponse(200, "Task updated", task);
  if (opId) {
    idempotencyStore.set(opId, 200, response);
  }

  res.json(response);
});

export const moveTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { columnId, position, opId } = req.body as {
    columnId: string;
    position?: number;
    opId?: string;
  };

  if (opId) {
    const cached = idempotencyStore.get(opId);
    if (cached) {
      return res.status(cached.statusCode).json(cached.data);
    }
  }

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const board = await Board.findById(task.board);
  if (!board) throw new ApiError(404, "Board not found");
  if (!board.columns.some((c) => String(c._id) === columnId)) {
    throw new ApiError(400, "Target column does not exist on this board");
  }
  assertBoardAccess(board, uid(req));

  const oldColumnId = String(task.columnId);

  // Position bounds validation & clamping
  let targetPosition: number;
  if (typeof position === "number" && !isNaN(position)) {
    targetPosition = Math.max(0, position);
  } else {
    targetPosition = await TaskService.getNextPosition(String(task.board), columnId);
  }

  const movedTask = await TaskService.moveTask({
    taskId,
    targetColumnId: columnId,
    targetPosition,
  });
  await movedTask.populate("assignees", "name email avatar");

  await ActivityService.log(
    req.user!._id,
    String(task.board),
    "TASK_MOVED",
    `moved task "${movedTask.title}"`,
    {
      taskId: String(movedTask._id),
      fromColumn: oldColumnId,
      toColumn: String(movedTask.columnId),
      position: movedTask.position,
    },
    String(movedTask._id)
  );

  io.to(`board:${String(task.board)}`).emit("task:moved", {
    boardId: String(task.board),
    taskId: String(movedTask._id),
    columnId: String(movedTask.columnId),
    position: movedTask.position,
    task: movedTask,
    actorId: uid(req),
    opId,
    version: movedTask.version,
  });

  const fromCol = board.columns.find((c) => String(c._id) === oldColumnId);
  const toCol = board.columns.find((c) => String(c._id) === columnId);
  const fromName = fromCol ? fromCol.name : "column";
  const toName = toCol ? toCol.name : "column";

  await NotificationService.send({
    recipientId: req.user!._id,
    senderId: req.user!._id,
    type: "TASK_MOVED",
    title: "Task Step Changed",
    message: `Task "${movedTask.title}" moved from ${fromName} to ${toName}`,
    boardId: task.board,
    taskId: movedTask._id,
  });

  const otherMemberIds = [board.owner, ...board.members]
    .map((m) => String((m as any)._id || m))
    .filter((id) => id !== uid(req));

  if (otherMemberIds.length > 0) {
    await NotificationService.sendToMany(otherMemberIds, {
      senderId: req.user!._id,
      type: "TASK_MOVED",
      title: "Task Step Changed",
      message: `${req.user!.name} moved task "${movedTask.title}" to ${toName}`,
      boardId: task.board,
      taskId: movedTask._id,
    });
  }

  const response = new ApiResponse(200, "Task moved successfully", movedTask);
  if (opId) {
    idempotencyStore.set(opId, 200, response);
  }

  res.json(response);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const opId = (req.body?.opId || req.query?.opId) as string | undefined;

  if (opId) {
    const cached = idempotencyStore.get(opId);
    if (cached) {
      return res.status(cached.statusCode).json(cached.data);
    }
  }

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const board = await Board.findById(task.board);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const deletedTitle = task.title;

  await Comment.deleteMany({ task: taskId });
  await Notification.deleteMany({ task: taskId });
  await task.deleteOne();

  await ActivityService.log(
    req.user!._id,
    String(task.board),
    "TASK_DELETED",
    `deleted task "${deletedTitle}"`,
    { taskId }
  );

  io.to(`board:${String(task.board)}`).emit("task:deleted", {
    boardId: String(task.board),
    taskId,
    actorId: uid(req),
    opId,
  });

  await NotificationService.send({
    recipientId: req.user!._id,
    senderId: req.user!._id,
    type: "TASK_DELETED",
    title: "Task Deleted",
    message: `Deleted task "${deletedTitle}"`,
    boardId: task.board,
  });

  const response = new ApiResponse(200, "Task deleted", null);
  if (opId) {
    idempotencyStore.set(opId, 200, response);
  }

  res.json(response);
});

export const archiveTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { isArchived = true } = req.body as { isArchived?: boolean };

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const board = await Board.findById(task.board);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  task.isArchived = isArchived;
  await task.save();
  await task.populate("assignees", "name email avatar");

  await ActivityService.log(
    req.user!._id,
    String(task.board),
    isArchived ? "TASK_ARCHIVED" : "TASK_RESTORED",
    `${isArchived ? "archived" : "restored"} task "${task.title}"`,
    { taskId: String(task._id) },
    String(task._id)
  );

  io.to(`board:${String(task.board)}`).emit("task:archived", {
    boardId: String(task.board),
    taskId: String(task._id),
    isArchived: task.isArchived,
    task,
  });

  res.json(new ApiResponse(200, isArchived ? "Task archived" : "Task restored", task));
});
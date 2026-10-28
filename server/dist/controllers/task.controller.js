"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveTask = exports.deleteTask = exports.moveTask = exports.updateTask = exports.createTask = exports.getColumnTasks = exports.getBoardTasks = void 0;
const mongoose_1 = require("mongoose");
const Board_1 = require("../models/Board");
const Comment_1 = require("../models/Comment");
const Notification_1 = require("../models/Notification");
const Task_1 = require("../models/Task");
const activity_service_1 = require("../services/activity.service");
const notification_service_1 = require("../services/notification.service");
const task_service_1 = require("../services/task.service");
const sockets_1 = require("../sockets");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const idOf_1 = require("../utils/idOf");
const idempotency_1 = require("../utils/idempotency");
const uid = (req) => String(req.user._id);
const assertBoardAccess = (board, userId) => {
    const isOwner = (0, idOf_1.idOf)(board.owner) === userId;
    const isMember = board.members.some((member) => (0, idOf_1.idOf)(member) === userId);
    if (!isOwner && !isMember) {
        throw new ApiError_1.ApiError(403, "You do not have access to this board");
    }
};
const handleTaskMentions = async (task, description, senderUser) => {
    if (!description || !senderUser)
        return;
    const board = await Board_1.Board.findById(task.board).populate("members", "name email avatar");
    if (!board)
        return;
    const allMembers = [board.owner, ...board.members];
    const mentionedUserIds = new Set();
    for (const member of allMembers) {
        const m = member;
        if (!m || String(m._id) === String(senderUser._id))
            continue;
        const nameMatch = description.toLowerCase().includes(`@${m.name.toLowerCase()}`);
        const idMatch = description.includes(String(m._id));
        if (nameMatch || idMatch) {
            mentionedUserIds.add(String(m._id));
        }
    }
    for (const recipientId of mentionedUserIds) {
        const notif = await Notification_1.Notification.create({
            recipient: new mongoose_1.Types.ObjectId(recipientId),
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
        sockets_1.io.to(`user:${recipientId}`).emit("notification:new", notif);
    }
};
exports.getBoardTasks = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const tasks = await Task_1.Task.find({ board: boardId, isArchived: { $ne: true } })
        .sort({ position: 1, _id: 1 })
        .populate("assignees", "name email avatar");
    const taskIds = tasks.map((t) => t._id);
    const commentCounts = await Comment_1.Comment.aggregate([
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
    res.json(new ApiResponse_1.ApiResponse(200, "Tasks fetched", tasksWithCounts));
});
exports.getColumnTasks = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId, columnId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const tasks = await Task_1.Task.find({ board: boardId, columnId, isArchived: { $ne: true } })
        .sort({ position: 1, _id: 1 })
        .populate("assignees", "name email avatar");
    const taskIds = tasks.map((t) => t._id);
    const commentCounts = await Comment_1.Comment.aggregate([
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
    res.json(new ApiResponse_1.ApiResponse(200, "Tasks fetched", tasksWithCounts));
});
exports.createTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId, columnId } = req.params;
    const { opId } = req.body;
    if (opId) {
        const cached = idempotency_1.idempotencyStore.get(opId);
        if (cached) {
            return res.status(cached.statusCode).json(cached.data);
        }
    }
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    if (!board.columns.some((c) => String(c._id) === columnId)) {
        throw new ApiError_1.ApiError(400, "Column does not exist on this board");
    }
    assertBoardAccess(board, uid(req));
    const position = await task_service_1.TaskService.getNextPosition(boardId, columnId);
    const task = await Task_1.Task.create({
        ...req.body,
        board: new mongoose_1.Types.ObjectId(boardId),
        columnId: new mongoose_1.Types.ObjectId(columnId),
        position,
        version: 1,
        createdBy: req.user._id,
    });
    await task.populate("assignees", "name email avatar");
    await handleTaskMentions(task, req.body.description, req.user);
    await activity_service_1.ActivityService.log(req.user._id, boardId, "TASK_CREATED", `created task "${task.title}"`, { taskId: String(task._id) }, String(task._id));
    sockets_1.io.to(`board:${boardId}`).emit("task:created", {
        boardId,
        taskId: String(task._id),
        task,
        actorId: uid(req),
        opId,
    });
    const targetCol = board.columns.find((c) => String(c._id) === columnId);
    const targetColName = targetCol ? targetCol.name : "board";
    await notification_service_1.NotificationService.send({
        recipientId: req.user._id,
        senderId: req.user._id,
        type: "TASK_CREATED",
        title: "Task Created",
        message: `Created task "${task.title}" in ${targetColName}`,
        boardId: board._id,
        taskId: task._id,
    });
    const otherMemberIds = [board.owner, ...board.members]
        .map((m) => String(m._id || m))
        .filter((id) => id !== uid(req));
    if (otherMemberIds.length > 0) {
        await notification_service_1.NotificationService.sendToMany(otherMemberIds, {
            senderId: req.user._id,
            type: "TASK_CREATED",
            title: "New Task Added",
            message: `${req.user.name} created task "${task.title}" in ${targetColName}`,
            boardId: board._id,
            taskId: task._id,
        });
    }
    const response = new ApiResponse_1.ApiResponse(201, "Task created", task);
    if (opId) {
        idempotency_1.idempotencyStore.set(opId, 201, response);
    }
    res.status(201).json(response);
});
exports.updateTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskId } = req.params;
    const { opId, version } = req.body;
    if (opId) {
        const cached = idempotency_1.idempotencyStore.get(opId);
        if (cached) {
            return res.status(cached.statusCode).json(cached.data);
        }
    }
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new ApiError_1.ApiError(404, "Task not found");
    const board = await Board_1.Board.findById(task.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    // Optimistic concurrency control: detect simultaneous update conflict
    if (typeof version === "number" && task.version !== undefined && task.version !== version) {
        await task.populate("assignees", "name email avatar");
        return res.status(409).json(new ApiResponse_1.ApiResponse(409, "VERSION_CONFLICT", task));
    }
    const { title, description, labels, dueDate, assignees, priority } = req.body;
    const changedFields = [];
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
        task.assignees = assignees.map((a) => new mongoose_1.Types.ObjectId(a));
        changedFields.push("assignees");
    }
    task.version = (task.version || 1) + 1;
    await task.save();
    await task.populate("assignees", "name email avatar");
    if (description) {
        await handleTaskMentions(task, description, req.user);
    }
    await activity_service_1.ActivityService.log(req.user._id, String(task.board), "TASK_UPDATED", `updated task "${task.title}"`, { taskId: String(task._id), changedFields }, String(task._id));
    sockets_1.io.to(`board:${String(task.board)}`).emit("task:updated", {
        boardId: String(task.board),
        taskId: String(task._id),
        task,
        changedFields,
        actorId: uid(req),
        opId,
        version: task.version,
    });
    const changesDesc = changedFields.length > 0 ? changedFields.join(", ") : "details";
    await notification_service_1.NotificationService.send({
        recipientId: req.user._id,
        senderId: req.user._id,
        type: "TASK_UPDATED",
        title: "Task Updated",
        message: `Updated task "${task.title}" (${changesDesc})`,
        boardId: task.board,
        taskId: task._id,
    });
    const response = new ApiResponse_1.ApiResponse(200, "Task updated", task);
    if (opId) {
        idempotency_1.idempotencyStore.set(opId, 200, response);
    }
    res.json(response);
});
exports.moveTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskId } = req.params;
    const { columnId, position, opId } = req.body;
    if (opId) {
        const cached = idempotency_1.idempotencyStore.get(opId);
        if (cached) {
            return res.status(cached.statusCode).json(cached.data);
        }
    }
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new ApiError_1.ApiError(404, "Task not found");
    const board = await Board_1.Board.findById(task.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    if (!board.columns.some((c) => String(c._id) === columnId)) {
        throw new ApiError_1.ApiError(400, "Target column does not exist on this board");
    }
    assertBoardAccess(board, uid(req));
    const oldColumnId = String(task.columnId);
    // Position bounds validation & clamping
    let targetPosition;
    if (typeof position === "number" && !isNaN(position)) {
        targetPosition = Math.max(0, position);
    }
    else {
        targetPosition = await task_service_1.TaskService.getNextPosition(String(task.board), columnId);
    }
    const movedTask = await task_service_1.TaskService.moveTask({
        taskId,
        targetColumnId: columnId,
        targetPosition,
    });
    await movedTask.populate("assignees", "name email avatar");
    await activity_service_1.ActivityService.log(req.user._id, String(task.board), "TASK_MOVED", `moved task "${movedTask.title}"`, {
        taskId: String(movedTask._id),
        fromColumn: oldColumnId,
        toColumn: String(movedTask.columnId),
        position: movedTask.position,
    }, String(movedTask._id));
    sockets_1.io.to(`board:${String(task.board)}`).emit("task:moved", {
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
    await notification_service_1.NotificationService.send({
        recipientId: req.user._id,
        senderId: req.user._id,
        type: "TASK_MOVED",
        title: "Task Step Changed",
        message: `Task "${movedTask.title}" moved from ${fromName} to ${toName}`,
        boardId: task.board,
        taskId: movedTask._id,
    });
    const otherMemberIds = [board.owner, ...board.members]
        .map((m) => String(m._id || m))
        .filter((id) => id !== uid(req));
    if (otherMemberIds.length > 0) {
        await notification_service_1.NotificationService.sendToMany(otherMemberIds, {
            senderId: req.user._id,
            type: "TASK_MOVED",
            title: "Task Step Changed",
            message: `${req.user.name} moved task "${movedTask.title}" to ${toName}`,
            boardId: task.board,
            taskId: movedTask._id,
        });
    }
    const response = new ApiResponse_1.ApiResponse(200, "Task moved successfully", movedTask);
    if (opId) {
        idempotency_1.idempotencyStore.set(opId, 200, response);
    }
    res.json(response);
});
exports.deleteTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskId } = req.params;
    const opId = (req.body?.opId || req.query?.opId);
    if (opId) {
        const cached = idempotency_1.idempotencyStore.get(opId);
        if (cached) {
            return res.status(cached.statusCode).json(cached.data);
        }
    }
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new ApiError_1.ApiError(404, "Task not found");
    const board = await Board_1.Board.findById(task.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const deletedTitle = task.title;
    await Comment_1.Comment.deleteMany({ task: taskId });
    await Notification_1.Notification.deleteMany({ task: taskId });
    await task.deleteOne();
    await activity_service_1.ActivityService.log(req.user._id, String(task.board), "TASK_DELETED", `deleted task "${deletedTitle}"`, { taskId });
    sockets_1.io.to(`board:${String(task.board)}`).emit("task:deleted", {
        boardId: String(task.board),
        taskId,
        actorId: uid(req),
        opId,
    });
    await notification_service_1.NotificationService.send({
        recipientId: req.user._id,
        senderId: req.user._id,
        type: "TASK_DELETED",
        title: "Task Deleted",
        message: `Deleted task "${deletedTitle}"`,
        boardId: task.board,
    });
    const response = new ApiResponse_1.ApiResponse(200, "Task deleted", null);
    if (opId) {
        idempotency_1.idempotencyStore.set(opId, 200, response);
    }
    res.json(response);
});
exports.archiveTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskId } = req.params;
    const { isArchived = true } = req.body;
    const task = await Task_1.Task.findById(taskId);
    if (!task)
        throw new ApiError_1.ApiError(404, "Task not found");
    const board = await Board_1.Board.findById(task.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    task.isArchived = isArchived;
    await task.save();
    await task.populate("assignees", "name email avatar");
    await activity_service_1.ActivityService.log(req.user._id, String(task.board), isArchived ? "TASK_ARCHIVED" : "TASK_RESTORED", `${isArchived ? "archived" : "restored"} task "${task.title}"`, { taskId: String(task._id) }, String(task._id));
    sockets_1.io.to(`board:${String(task.board)}`).emit("task:archived", {
        boardId: String(task.board),
        taskId: String(task._id),
        isArchived: task.isArchived,
        task,
    });
    res.json(new ApiResponse_1.ApiResponse(200, isArchived ? "Task archived" : "Task restored", task));
});
//# sourceMappingURL=task.controller.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardInvitations = exports.respondToInvitation = exports.getUserPendingInvitations = exports.regenerateBoardInviteCode = exports.joinWorkspaceByNameOrId = exports.joinBoardByInviteCode = exports.getBoardPreviewByInviteCode = exports.getBoardInviteCode = exports.removeMember = exports.addMember = exports.removeColumn = exports.reorderColumns = exports.renameColumn = exports.addColumn = exports.deleteBoard = exports.updateBoard = exports.getBoardById = exports.getWorkspaceMembers = exports.getMyBoards = exports.getDashboardStats = exports.createBoard = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Activity_1 = require("../models/Activity");
const Board_1 = require("../models/Board");
const Comment_1 = require("../models/Comment");
const Invitation_1 = require("../models/Invitation");
const Notification_1 = require("../models/Notification");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const activity_service_1 = require("../services/activity.service");
const notification_service_1 = require("../services/notification.service");
const sockets_1 = require("../sockets");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const idOf_1 = require("../utils/idOf");
const uid = (req) => String(req.user._id);
const generateInviteCode = () => {
    return "inv_" + crypto_1.default.randomBytes(6).toString("hex");
};
const assertBoardAccess = (board, userId) => {
    const isOwner = (0, idOf_1.idOf)(board.owner) === userId;
    const isMember = board.members.some((member) => (0, idOf_1.idOf)(member) === userId);
    if (!isOwner && !isMember) {
        throw new ApiError_1.ApiError(403, "You do not have access to this board");
    }
};
const formatBoardResponse = (boardDoc) => {
    const obj = boardDoc.toObject ? boardDoc.toObject() : boardDoc;
    return {
        ...obj,
        title: obj.title || obj.name,
    };
};
exports.createBoard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const boardName = req.body.name || req.body.title;
    const board = await Board_1.Board.create({
        name: boardName,
        description: req.body.description,
        owner: req.user._id,
        inviteCode: generateInviteCode(),
        columns: [
            { name: "To Do", order: 0 },
            { name: "In Progress", order: 1 },
            { name: "Review", order: 2 },
            { name: "Done", order: 3 },
        ],
    });
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "BOARD_CREATED", `created board "${board.name}"`);
    await notification_service_1.NotificationService.send({
        recipientId: req.user._id,
        senderId: req.user._id,
        type: "PROJECT_CREATED",
        title: "Project Created",
        message: `You created project "${board.name}"`,
        boardId: board._id,
    });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "Board created", formatBoardResponse(board)));
});
exports.getDashboardStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const boards = await Board_1.Board.find({
        $or: [{ owner: userId }, { members: userId }],
        isArchived: false,
    })
        .populate("owner", "name email avatar")
        .populate("members", "name email avatar")
        .sort({ updatedAt: -1 });
    const boardIds = boards.map((b) => b._id);
    const tasks = await Task_1.Task.find({ board: { $in: boardIds } })
        .populate("assignees", "name email avatar")
        .populate("board", "name title");
    let totalTasks = tasks.length;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    const columnTypeMap = new Map();
    boards.forEach((board) => {
        board.columns.forEach((col) => {
            const colName = col.name.toLowerCase();
            if (colName.includes("done") || colName.includes("complete")) {
                columnTypeMap.set(String(col._id), "done");
            }
            else if (colName.includes("progress") || colName.includes("doing") || colName.includes("review")) {
                columnTypeMap.set(String(col._id), "progress");
            }
            else {
                columnTypeMap.set(String(col._id), "todo");
            }
        });
    });
    tasks.forEach((task) => {
        const colType = columnTypeMap.get(String(task.columnId));
        if (colType === "done")
            completedTasks++;
        else if (colType === "progress")
            inProgressTasks++;
        else
            todoTasks++;
    });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const upcomingDeadlines = tasks
        .filter((t) => {
        if (!t.dueDate)
            return false;
        const colType = columnTypeMap.get(String(t.columnId));
        return colType !== "done";
    })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 100)
        .map((t) => {
        const obj = typeof t.toObject === "function" ? t.toObject() : t;
        return {
            ...obj,
            status: columnTypeMap.get(String(t.columnId)) || "todo",
        };
    });
    const activities = await Activity_1.Activity.find({ board: { $in: boardIds } })
        .populate("user", "name email avatar")
        .populate("board", "name title")
        .sort({ createdAt: -1 })
        .limit(20);
    const projects = boards.map((b) => {
        const boardTasks = tasks.filter((t) => {
            const bId = t.board?._id ? String(t.board._id) : String(t.board);
            return bId === String(b._id);
        });
        const bDone = boardTasks.filter((t) => columnTypeMap.get(String(t.columnId)) === "done").length;
        const bProgress = boardTasks.filter((t) => columnTypeMap.get(String(t.columnId)) === "progress").length;
        const bTodo = boardTasks.length - bDone - bProgress;
        const bRate = boardTasks.length > 0 ? Math.round((bDone / boardTasks.length) * 100) : 0;
        return {
            ...formatBoardResponse(b),
            tasksCount: boardTasks.length,
            doneCount: bDone,
            progressCount: bProgress,
            todoCount: bTodo,
            completionRate: bRate,
        };
    });
    res.json(new ApiResponse_1.ApiResponse(200, "Dashboard stats fetched", {
        activeProjects: boards.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate,
        upcomingDeadlines,
        recentActivities: activities,
        projects,
    }));
});
exports.getMyBoards = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const boards = await Board_1.Board.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
        isArchived: false,
    })
        .populate("owner", "name email avatar")
        .populate("members", "name email avatar")
        .sort({ updatedAt: -1 });
    const formatted = boards.map(formatBoardResponse);
    res.json(new ApiResponse_1.ApiResponse(200, "Boards fetched", formatted));
});
exports.getWorkspaceMembers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id;
    const boards = await Board_1.Board.find({
        $or: [{ owner: userId }, { members: userId }],
        isArchived: false,
    })
        .populate("owner", "name email avatar")
        .populate("members", "name email avatar");
    // Determine which users have created at least one project by themselves as owner
    const ownedBoardUserIds = new Set((await Board_1.Board.distinct("owner", { isArchived: false })).map((id) => String(id)));
    const memberMap = new Map();
    boards.forEach((board) => {
        const boardTitle = board.name || board.title || "Project";
        const boardId = String(board._id);
        // Process owner
        if (board.owner) {
            const ownerObj = board.owner;
            const ownerId = String(ownerObj._id || ownerObj);
            const isOwnerAdmin = ownedBoardUserIds.has(ownerId);
            if (memberMap.has(ownerId)) {
                const existing = memberMap.get(ownerId);
                if (isOwnerAdmin)
                    existing.role = "Admin";
                if (!existing.boards.includes(boardTitle))
                    existing.boards.push(boardTitle);
                if (!existing.boardIds.includes(boardId))
                    existing.boardIds.push(boardId);
            }
            else {
                memberMap.set(ownerId, {
                    _id: ownerId,
                    name: ownerObj.name || "Owner",
                    email: ownerObj.email || "",
                    avatar: ownerObj.avatar,
                    role: isOwnerAdmin ? "Admin" : "Member",
                    boards: [boardTitle],
                    boardIds: [boardId],
                });
            }
        }
        // Process members
        if (board.members && Array.isArray(board.members)) {
            board.members.forEach((m) => {
                if (!m)
                    return;
                const mId = String(m._id || m);
                const isMemberAdmin = ownedBoardUserIds.has(mId);
                if (memberMap.has(mId)) {
                    const existing = memberMap.get(mId);
                    if (isMemberAdmin)
                        existing.role = "Admin";
                    if (!existing.boards.includes(boardTitle))
                        existing.boards.push(boardTitle);
                    if (!existing.boardIds.includes(boardId))
                        existing.boardIds.push(boardId);
                }
                else {
                    memberMap.set(mId, {
                        _id: mId,
                        name: m.name || "Member",
                        email: m.email || "",
                        avatar: m.avatar,
                        role: isMemberAdmin ? "Admin" : "Member",
                        boards: [boardTitle],
                        boardIds: [boardId],
                    });
                }
            });
        }
    });
    const memberList = Array.from(memberMap.values());
    res.json(new ApiResponse_1.ApiResponse(200, "Workspace members fetched", memberList));
});
exports.getBoardById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId)
        .populate("owner", "name email avatar")
        .populate("members", "name email avatar");
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    if (!board.inviteCode) {
        board.inviteCode = generateInviteCode();
        await board.save();
    }
    // Ensure Review column exists on board if it has standard columns
    const hasReview = board.columns.some((c) => c.name.toLowerCase().includes("review"));
    if (!hasReview && board.columns.length > 0) {
        const doneIndex = board.columns.findIndex((c) => c.name.toLowerCase().includes("done"));
        if (doneIndex !== -1) {
            board.columns.splice(doneIndex, 0, { name: "Review", order: doneIndex });
            board.columns.forEach((c, idx) => {
                c.order = idx;
            });
            await board.save();
        }
    }
    res.json(new ApiResponse_1.ApiResponse(200, "Board fetched", formatBoardResponse(board)));
});
exports.updateBoard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const newName = req.body.name || req.body.title;
    if (typeof newName === "string")
        board.name = newName;
    if (typeof req.body.description === "string") {
        board.description = req.body.description;
    }
    await board.save();
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "BOARD_UPDATED", `updated board "${board.name}"`);
    await notification_service_1.NotificationService.send({
        recipientId: req.user._id,
        senderId: req.user._id,
        type: "GENERAL",
        title: "Project Updated",
        message: `Project updated to "${board.name}"`,
        boardId: board._id,
    });
    res.json(new ApiResponse_1.ApiResponse(200, "Board updated", formatBoardResponse(board)));
});
exports.deleteBoard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    if ((0, idOf_1.idOf)(board.owner) !== uid(req)) {
        throw new ApiError_1.ApiError(403, "Only the board owner can delete this board");
    }
    const deletedBoardName = board.name;
    const boardMemberIds = [board.owner, ...board.members].map((m) => String(m._id || m));
    const taskIds = await Task_1.Task.find({ board: boardId }).select("_id");
    await Comment_1.Comment.deleteMany({ task: { $in: taskIds } });
    await Task_1.Task.deleteMany({ board: boardId });
    await Activity_1.Activity.deleteMany({ board: boardId });
    await Invitation_1.Invitation.deleteMany({ board: boardId });
    await Notification_1.Notification.deleteMany({ board: boardId });
    await board.deleteOne();
    sockets_1.io.to(`board:${boardId}`).emit("board:deleted", { boardId });
    await notification_service_1.NotificationService.sendToMany(boardMemberIds, {
        senderId: req.user._id,
        type: "PROJECT_DELETED",
        title: "Project Deleted",
        message: `Project "${deletedBoardName}" was deleted`,
    });
    res.json(new ApiResponse_1.ApiResponse(200, "Board deleted", null));
});
exports.addColumn = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const order = board.columns.length;
    board.columns.push({ name: req.body.name, order });
    await board.save();
    const column = board.columns[board.columns.length - 1];
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "COLUMN_ADDED", `added column "${req.body.name}"`);
    sockets_1.io.to(`board:${boardId}`).emit("column:added", { boardId, column });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "Column added", column));
});
exports.renameColumn = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId, columnId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const column = board.columns.find((c) => String(c._id) === columnId);
    if (!column)
        throw new ApiError_1.ApiError(404, "Column not found");
    const oldName = column.name;
    column.name = req.body.name;
    await board.save();
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "COLUMN_RENAMED", `renamed column "${oldName}" to "${column.name}"`);
    sockets_1.io.to(`board:${boardId}`).emit("column:renamed", {
        boardId,
        columnId,
        name: column.name,
    });
    res.json(new ApiResponse_1.ApiResponse(200, "Column renamed", column));
});
exports.reorderColumns = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const { columnIds } = req.body;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const colMap = new Map(board.columns.map((c) => [String(c._id), c]));
    const reordered = [];
    columnIds.forEach((id, index) => {
        const col = colMap.get(id);
        if (col) {
            col.order = index;
            reordered.push(col);
        }
    });
    board.columns.forEach((c) => {
        if (!columnIds.includes(String(c._id))) {
            reordered.push(c);
        }
    });
    board.columns = reordered;
    await board.save();
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "COLUMN_RENAMED", `reordered board columns`);
    sockets_1.io.to(`board:${boardId}`).emit("column:reordered", { boardId, columns: board.columns });
    res.json(new ApiResponse_1.ApiResponse(200, "Columns reordered", formatBoardResponse(board)));
});
exports.removeColumn = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId, columnId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const index = board.columns.findIndex((c) => String(c._id) === columnId);
    if (index === -1)
        throw new ApiError_1.ApiError(404, "Column not found");
    const removed = board.columns[index];
    board.columns.splice(index, 1);
    await board.save();
    await Task_1.Task.deleteMany({ board: boardId, columnId });
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "COLUMN_DELETED", `deleted column "${removed.name}"`);
    sockets_1.io.to(`board:${boardId}`).emit("column:deleted", { boardId, columnId });
    res.json(new ApiResponse_1.ApiResponse(200, "Column deleted", null));
});
/** Request-based Invitation: Sends pending invitation request & notification */
exports.addMember = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const { userId, email } = req.body;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    let user = null;
    if (email) {
        user = await User_1.User.findOne({ email: email.toLowerCase() });
    }
    else if (userId) {
        user = await User_1.User.findById(userId);
    }
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found with this email");
    const targetUserId = String(user._id);
    if ((0, idOf_1.idOf)(board.owner) === targetUserId || board.members.some((m) => (0, idOf_1.idOf)(m) === targetUserId)) {
        throw new ApiError_1.ApiError(409, "User is already a member of this board");
    }
    const existingInvite = await Invitation_1.Invitation.findOne({
        board: board._id,
        invitee: user._id,
        status: "pending",
    });
    if (existingInvite) {
        throw new ApiError_1.ApiError(409, "An invitation is already pending for this user");
    }
    const invitation = await Invitation_1.Invitation.create({
        board: board._id,
        inviter: req.user._id,
        invitee: user._id,
        inviteeEmail: user.email,
        status: "pending",
    });
    await invitation.populate([
        { path: "inviter", select: "name email avatar" },
        { path: "invitee", select: "name email avatar" },
        { path: "board", select: "name title description" },
    ]);
    const notif = await Notification_1.Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: "BOARD_INVITATION",
        title: "Board Invitation Request",
        message: `${req.user.name} sent you an invitation request to join board "${board.name}"`,
        board: board._id,
        invitation: invitation._id,
    });
    await notif.populate([
        { path: "sender", select: "name email avatar" },
        { path: "board", select: "name title description" },
        { path: "invitation" },
    ]);
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "MEMBER_ADDED", `sent invitation request to ${user.name} (${user.email})`, { userId: targetUserId, invitationId: String(invitation._id) });
    sockets_1.io.emit("invite:sent", {
        inviteeId: targetUserId,
        invitation,
    });
    sockets_1.io.to(`user:${targetUserId}`).emit("notification:new", notif);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "Invitation request sent", invitation));
});
/** Owner Kick Member Endpoint */
exports.removeMember = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId, userId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    if ((0, idOf_1.idOf)(board.owner) !== uid(req)) {
        throw new ApiError_1.ApiError(403, "Only the board owner can kick/remove members");
    }
    const index = board.members.findIndex((member) => String(member) === userId);
    if (index === -1)
        throw new ApiError_1.ApiError(404, "User is not a member of this board");
    board.members.splice(index, 1);
    await board.save();
    await activity_service_1.ActivityService.log(req.user._id, String(board._id), "MEMBER_REMOVED", `kicked member from the board`, { userId });
    sockets_1.io.to(`board:${boardId}`).emit("board:member-removed", { boardId, userId });
    res.json(new ApiResponse_1.ApiResponse(200, "Member kicked successfully", formatBoardResponse(board)));
});
/** Share Link Endpoints */
exports.getBoardInviteCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    if (!board.inviteCode) {
        board.inviteCode = generateInviteCode();
        await board.save();
    }
    res.json(new ApiResponse_1.ApiResponse(200, "Invite code fetched", { inviteCode: board.inviteCode }));
});
exports.getBoardPreviewByInviteCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { inviteCode } = req.params;
    const board = await Board_1.Board.findOne({ inviteCode })
        .populate("owner", "name email avatar")
        .select("name description owner members createdAt inviteCode");
    if (!board)
        throw new ApiError_1.ApiError(404, "Invalid or expired board share link");
    res.json(new ApiResponse_1.ApiResponse(200, "Board preview fetched", {
        boardId: String(board._id),
        title: board.name,
        description: board.description,
        owner: board.owner,
        membersCount: board.members.length + 1,
        inviteCode: board.inviteCode,
    }));
});
exports.joinBoardByInviteCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { inviteCode } = req.params;
    const board = await Board_1.Board.findOne({ inviteCode });
    if (!board)
        throw new ApiError_1.ApiError(404, "Invalid or expired board share link");
    const currentUserId = uid(req);
    const isOwner = (0, idOf_1.idOf)(board.owner) === currentUserId;
    const isMember = board.members.some((m) => (0, idOf_1.idOf)(m) === currentUserId);
    if (!isOwner && !isMember) {
        board.members.push(req.user._id);
        await board.save();
        await activity_service_1.ActivityService.log(req.user._id, String(board._id), "MEMBER_ADDED", `${req.user.name} joined board via share link`, { userId: currentUserId });
        if ((0, idOf_1.idOf)(board.owner) !== currentUserId) {
            const ownerNotif = await Notification_1.Notification.create({
                recipient: board.owner,
                sender: req.user._id,
                type: "BOARD_INVITATION",
                title: "New Board Member Joined",
                message: `${req.user.name} joined board "${board.name}" via share link`,
                board: board._id,
            });
            await ownerNotif.populate([
                { path: "sender", select: "name email avatar" },
                { path: "board", select: "name title description" },
            ]);
            sockets_1.io.to(`user:${(0, idOf_1.idOf)(board.owner)}`).emit("notification:new", ownerNotif);
        }
        sockets_1.io.to(`board:${String(board._id)}`).emit("board:member-added", {
            boardId: String(board._id),
            member: { _id: currentUserId, name: req.user.name, email: req.user.email },
        });
        sockets_1.io.emit("workspace:member-added", {
            boardId: String(board._id),
            member: { _id: currentUserId, name: req.user.name, email: req.user.email },
        });
    }
    await board.populate([
        { path: "owner", select: "name email avatar" },
        { path: "members", select: "name email avatar" },
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, "Successfully joined board", {
        boardId: String(board._id),
        board: formatBoardResponse(board),
    }));
});
exports.joinWorkspaceByNameOrId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workspaceName, boardId, inviteCode } = req.body;
    let board = null;
    if (inviteCode) {
        board = await Board_1.Board.findOne({ inviteCode });
    }
    else if (boardId) {
        board = await Board_1.Board.findById(boardId);
    }
    else if (workspaceName) {
        board = await Board_1.Board.findOne({
            $or: [
                { name: new RegExp("^" + workspaceName.trim() + "$", "i") },
                { title: new RegExp("^" + workspaceName.trim() + "$", "i") },
            ],
            isArchived: false,
        });
    }
    if (!board) {
        throw new ApiError_1.ApiError(404, "Workspace or project not found");
    }
    const currentUserId = uid(req);
    const isOwner = (0, idOf_1.idOf)(board.owner) === currentUserId;
    const isMember = board.members.some((m) => (0, idOf_1.idOf)(m) === currentUserId);
    if (!isOwner && !isMember) {
        board.members.push(req.user._id);
        await board.save();
        await activity_service_1.ActivityService.log(req.user._id, String(board._id), "MEMBER_ADDED", `${req.user.name} accepted invitation and joined "${board.name}"`, { userId: currentUserId });
        if ((0, idOf_1.idOf)(board.owner) !== currentUserId) {
            const ownerNotif = await Notification_1.Notification.create({
                recipient: board.owner,
                sender: req.user._id,
                type: "BOARD_INVITATION",
                title: "New Team Member Joined",
                message: `${req.user.name} accepted invitation to join "${board.name}"`,
                board: board._id,
            });
            await ownerNotif.populate([
                { path: "sender", select: "name email avatar" },
                { path: "board", select: "name title description" },
            ]);
            sockets_1.io.to(`user:${(0, idOf_1.idOf)(board.owner)}`).emit("notification:new", ownerNotif);
        }
        sockets_1.io.to(`board:${String(board._id)}`).emit("board:member-added", {
            boardId: String(board._id),
            member: { _id: currentUserId, name: req.user.name, email: req.user.email },
        });
        sockets_1.io.emit("workspace:member-added", {
            boardId: String(board._id),
            member: { _id: currentUserId, name: req.user.name, email: req.user.email },
        });
    }
    await board.populate([
        { path: "owner", select: "name email avatar" },
        { path: "members", select: "name email avatar" },
    ]);
    res.json(new ApiResponse_1.ApiResponse(200, "Successfully joined workspace", {
        boardId: String(board._id),
        board: formatBoardResponse(board),
    }));
});
exports.regenerateBoardInviteCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    if ((0, idOf_1.idOf)(board.owner) !== uid(req)) {
        throw new ApiError_1.ApiError(403, "Only the board owner can regenerate share links");
    }
    board.inviteCode = generateInviteCode();
    await board.save();
    res.json(new ApiResponse_1.ApiResponse(200, "Share link regenerated", { inviteCode: board.inviteCode }));
});
/** Get current user's pending invitations */
exports.getUserPendingInvitations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const invitations = await Invitation_1.Invitation.find({
        invitee: req.user._id,
        status: "pending",
    })
        .populate("inviter", "name email avatar")
        .populate("board", "name title description")
        .sort({ createdAt: -1 });
    res.json(new ApiResponse_1.ApiResponse(200, "Pending invitations fetched", invitations));
});
/** Respond to invitation (accept or decline) */
exports.respondToInvitation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { invitationId } = req.params;
    const { action } = req.body;
    const invitation = await Invitation_1.Invitation.findById(invitationId);
    if (!invitation)
        throw new ApiError_1.ApiError(404, "Invitation not found");
    if (String(invitation.invitee) !== uid(req)) {
        throw new ApiError_1.ApiError(403, "You can only respond to your own invitations");
    }
    if (invitation.status !== "pending") {
        throw new ApiError_1.ApiError(400, `Invitation has already been ${invitation.status}`);
    }
    const board = await Board_1.Board.findById(invitation.board);
    if (!board)
        throw new ApiError_1.ApiError(404, "Associated board no longer exists");
    if (action === "accept") {
        invitation.status = "accepted";
        await invitation.save();
        if (!board.members.some((m) => (0, idOf_1.idOf)(m) === uid(req))) {
            board.members.push(req.user._id);
            await board.save();
        }
        await board.populate("members", "name email avatar");
        await activity_service_1.ActivityService.log(req.user._id, String(board._id), "MEMBER_ADDED", `${req.user.name} accepted invitation and joined the board`, { userId: uid(req) });
        sockets_1.io.to(`board:${String(board._id)}`).emit("board:member-added", {
            boardId: String(board._id),
            member: { _id: uid(req), name: req.user.name, email: req.user.email },
        });
    }
    else {
        invitation.status = "declined";
        await invitation.save();
    }
    await Notification_1.Notification.updateMany({ invitation: invitation._id, recipient: req.user._id }, { $set: { isRead: true } });
    res.json(new ApiResponse_1.ApiResponse(200, `Invitation ${action}ed successfully`, {
        invitation,
        board: formatBoardResponse(board),
    }));
});
/** Get all invitations sent for a specific board */
exports.getBoardInvitations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { boardId } = req.params;
    const board = await Board_1.Board.findById(boardId);
    if (!board)
        throw new ApiError_1.ApiError(404, "Board not found");
    assertBoardAccess(board, uid(req));
    const invitations = await Invitation_1.Invitation.find({ board: boardId })
        .populate("inviter", "name email avatar")
        .populate("invitee", "name email avatar")
        .sort({ createdAt: -1 });
    res.json(new ApiResponse_1.ApiResponse(200, "Board invitations fetched", invitations));
});
//# sourceMappingURL=board.controller.js.map
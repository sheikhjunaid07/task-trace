import { Request, Response } from "express";
import { Types } from "mongoose";
import crypto from "crypto";
import { Activity } from "../models/Activity";
import { Board, IBoard, IColumn } from "../models/Board";
import { Comment } from "../models/Comment";
import { Invitation } from "../models/Invitation";
import { Notification } from "../models/Notification";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { ActivityService } from "../services/activity.service";
import { NotificationService } from "../services/notification.service";
import { io } from "../sockets";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { idOf } from "../utils/idOf";

const uid = (req: Request): string => String(req.user!._id);

const generateInviteCode = (): string => {
  return "inv_" + crypto.randomBytes(6).toString("hex");
};

const assertBoardAccess = (board: IBoard, userId: string): void => {
  const isOwner = idOf(board.owner) === userId;
  const isMember = board.members.some((member) => idOf(member) === userId);
  if (!isOwner && !isMember) {
    throw new ApiError(403, "You do not have access to this board");
  }
};

const formatBoardResponse = (boardDoc: any) => {
  const obj = boardDoc.toObject ? boardDoc.toObject() : boardDoc;
  return {
    ...obj,
    title: obj.title || obj.name,
  };
};

export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const boardName = req.body.name || req.body.title;
  const board = await Board.create({
    name: boardName,
    description: req.body.description,
    icon: req.body.icon || "🚀",
    color: req.body.color || "#8b5cf6",
    avatarUrl: req.body.avatarUrl || null,
    visibility: req.body.visibility || "private",
    owner: req.user!._id,
    inviteCode: generateInviteCode(),
    memberRoles: [{ user: req.user!._id, role: "admin" }],
    columns: [
      { name: "To Do", order: 0, wipLimit: null },
      { name: "In Progress", order: 1, wipLimit: 5 },
      { name: "Review", order: 2, wipLimit: 3 },
      { name: "Done", order: 3, wipLimit: null },
    ],
  } as Partial<IBoard>);

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "BOARD_CREATED",
    `created board "${board.name}"`
  );

  await NotificationService.send({
    recipientId: req.user!._id,
    senderId: req.user!._id,
    type: "PROJECT_CREATED",
    title: "Project Created",
    message: `You created project "${board.name}"`,
    boardId: board._id,
  });

  res.status(201).json(new ApiResponse(201, "Board created", formatBoardResponse(board)));
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const boards = await Board.find({
    $or: [{ owner: userId }, { members: userId }],
    isArchived: false,
  })
    .populate("owner", "name email avatar")
    .populate("members", "name email avatar")
    .sort({ updatedAt: -1 });

  const boardIds = boards.map((b) => b._id);
  const tasks = await Task.find({ board: { $in: boardIds } })
    .populate("assignees", "name email avatar")
    .populate("board", "name title");

  let totalTasks = tasks.length;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let todoTasks = 0;

  const columnTypeMap = new Map<string, "done" | "progress" | "todo">();
  boards.forEach((board) => {
    board.columns.forEach((col) => {
      const colName = col.name.toLowerCase();
      if (colName.includes("done") || colName.includes("complete")) {
        columnTypeMap.set(String(col._id), "done");
      } else if (colName.includes("progress") || colName.includes("doing") || colName.includes("review")) {
        columnTypeMap.set(String(col._id), "progress");
      } else {
        columnTypeMap.set(String(col._id), "todo");
      }
    });
  });

  tasks.forEach((task) => {
    const colType = columnTypeMap.get(String(task.columnId));
    if (colType === "done") completedTasks++;
    else if (colType === "progress") inProgressTasks++;
    else todoTasks++;
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingDeadlines = tasks
    .filter((t) => {
      if (!t.dueDate) return false;
      const colType = columnTypeMap.get(String(t.columnId));
      return colType !== "done";
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 100)
    .map((t) => {
      const obj = typeof (t as any).toObject === "function" ? (t as any).toObject() : t;
      return {
        ...obj,
        status: columnTypeMap.get(String(t.columnId)) || "todo",
      };
    });

  const activities = await Activity.find({ board: { $in: boardIds } })
    .populate("user", "name email avatar")
    .populate("board", "name title")
    .sort({ createdAt: -1 })
    .limit(20);

  const projects = boards.map((b) => {
    const boardTasks = tasks.filter((t) => {
      const bId = (t.board as any)?._id ? String((t.board as any)._id) : String(t.board);
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

  res.json(
    new ApiResponse(200, "Dashboard stats fetched", {
      activeProjects: boards.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      upcomingDeadlines,
      recentActivities: activities,
      projects,
    })
  );
});

export const getMyBoards = asyncHandler(async (req: Request, res: Response) => {
  const boards = await Board.find({
    $or: [{ owner: req.user!._id }, { members: req.user!._id }],
    isArchived: false,
  })
    .populate("owner", "name email avatar")
    .populate("members", "name email avatar")
    .sort({ updatedAt: -1 });

  const formatted = boards.map(formatBoardResponse);
  res.json(new ApiResponse(200, "Boards fetched", formatted));
});

export const getWorkspaceMembers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const boards = await Board.find({
    $or: [{ owner: userId }, { members: userId }],
    isArchived: false,
  })
    .populate("owner", "name email avatar")
    .populate("members", "name email avatar");

  // Determine which users have created at least one project by themselves as owner
  const ownedBoardUserIds = new Set(
    (await Board.distinct("owner", { isArchived: false })).map((id) => String(id))
  );

  const memberMap = new Map<
    string,
    {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
      role: "Admin" | "Member";
      boards: string[];
      boardIds: string[];
    }
  >();

  boards.forEach((board) => {
    const boardTitle = board.name || (board as any).title || "Project";
    const boardId = String(board._id);

    // Process owner
    if (board.owner) {
      const ownerObj: any = board.owner;
      const ownerId = String(ownerObj._id || ownerObj);
      const isOwnerAdmin = ownedBoardUserIds.has(ownerId);
      if (memberMap.has(ownerId)) {
        const existing = memberMap.get(ownerId)!;
        if (isOwnerAdmin) existing.role = "Admin";
        if (!existing.boards.includes(boardTitle)) existing.boards.push(boardTitle);
        if (!existing.boardIds.includes(boardId)) existing.boardIds.push(boardId);
      } else {
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
      board.members.forEach((m: any) => {
        if (!m) return;
        const mId = String(m._id || m);
        const isMemberAdmin = ownedBoardUserIds.has(mId);
        if (memberMap.has(mId)) {
          const existing = memberMap.get(mId)!;
          if (isMemberAdmin) existing.role = "Admin";
          if (!existing.boards.includes(boardTitle)) existing.boards.push(boardTitle);
          if (!existing.boardIds.includes(boardId)) existing.boardIds.push(boardId);
        } else {
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
  res.json(new ApiResponse(200, "Workspace members fetched", memberList));
});

export const getBoardById = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId)
    .populate("owner", "name email avatar")
    .populate("members", "name email avatar")
    .populate("memberRoles.user", "name email avatar");
  if (!board) throw new ApiError(404, "Board not found");

  assertBoardAccess(board, uid(req));

  let needsSave = false;

  if (!board.inviteCode) {
    board.inviteCode = generateInviteCode();
    needsSave = true;
  }

  // Ensure default labels if none
  if (!board.labels || board.labels.length === 0) {
    board.labels = [
      { name: "Bug", color: "#ef4444" },
      { name: "Feature", color: "#3b82f6" },
      { name: "Design", color: "#8b5cf6" },
      { name: "DevOps", color: "#10b981" },
      { name: "Documentation", color: "#f59e0b" },
    ] as any;
    needsSave = true;
  }

  if (!board.icon) {
    board.icon = "🚀";
    needsSave = true;
  }
  if (!board.color) {
    board.color = "#8b5cf6";
    needsSave = true;
  }
  if (!board.visibility) {
    board.visibility = "private";
    needsSave = true;
  }

  // Ensure owner is admin in memberRoles
  if (!board.memberRoles) board.memberRoles = [];
  const ownerId = idOf(board.owner);
  if (!board.memberRoles.some((mr) => idOf(mr.user) === ownerId)) {
    board.memberRoles.push({ user: new Types.ObjectId(ownerId), role: "admin" });
    needsSave = true;
  }

  // Ensure Review column exists on board if it has standard columns
  const hasReview = board.columns.some((c) => c.name.toLowerCase().includes("review"));
  if (!hasReview && board.columns.length > 0) {
    const doneIndex = board.columns.findIndex((c) => c.name.toLowerCase().includes("done"));
    if (doneIndex !== -1) {
      board.columns.splice(doneIndex, 0, { name: "Review", order: doneIndex } as any);
      board.columns.forEach((c, idx) => {
        c.order = idx;
      });
      needsSave = true;
    }
  }

  if (needsSave) {
    await board.save();
  }

  res.json(new ApiResponse(200, "Board fetched", formatBoardResponse(board)));
});

export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const newName = req.body.name || req.body.title;
  if (typeof newName === "string" && newName.trim()) board.name = newName.trim();
  if (typeof req.body.description === "string") {
    board.description = req.body.description;
  }
  if (typeof req.body.icon === "string") {
    board.icon = req.body.icon;
  }
  if (typeof req.body.color === "string") {
    board.color = req.body.color;
  }
  if (req.body.avatarUrl !== undefined) {
    board.avatarUrl = req.body.avatarUrl;
  }
  if (req.body.visibility === "public" || req.body.visibility === "private") {
    board.visibility = req.body.visibility;
  }
  if (Array.isArray(req.body.labels)) {
    board.labels = req.body.labels as any;
  }

  await board.save();
  await board.populate([
    { path: "owner", select: "name email avatar" },
    { path: "members", select: "name email avatar" },
    { path: "memberRoles.user", select: "name email avatar" },
  ]);

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "BOARD_UPDATED",
    `updated settings for board "${board.name}"`
  );

  io.to(`board:${boardId}`).emit("board:updated", {
    boardId,
    board: formatBoardResponse(board),
  });

  await NotificationService.send({
    recipientId: req.user!._id,
    senderId: req.user!._id,
    type: "GENERAL",
    title: "Project Updated",
    message: `Project updated to "${board.name}"`,
    boardId: board._id,
  });

  res.json(new ApiResponse(200, "Board updated", formatBoardResponse(board)));
});

export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  if (idOf(board.owner) !== uid(req)) {
    throw new ApiError(403, "Only the board owner can delete this board");
  }

  const deletedBoardName = board.name;
  const boardMemberIds = [board.owner, ...board.members].map((m) => String((m as any)._id || m));

  const taskIds = await Task.find({ board: boardId }).select("_id");
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ board: boardId });
  await Activity.deleteMany({ board: boardId });
  await Invitation.deleteMany({ board: boardId });
  await Notification.deleteMany({ board: boardId });
  await board.deleteOne();

  io.to(`board:${boardId}`).emit("board:deleted", { boardId });

  await NotificationService.sendToMany(boardMemberIds, {
    senderId: req.user!._id,
    type: "PROJECT_DELETED",
    title: "Project Deleted",
    message: `Project "${deletedBoardName}" was deleted`,
  });

  res.json(new ApiResponse(200, "Board deleted", null));
});

export const addColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const order = board.columns.length;
  board.columns.push({ name: req.body.name, order } as IColumn);
  await board.save();

  const column = board.columns[board.columns.length - 1];

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "COLUMN_ADDED",
    `added column "${req.body.name}"`
  );
  io.to(`board:${boardId}`).emit("column:added", { boardId, column });

  res.status(201).json(new ApiResponse(201, "Column added", column));
});

export const renameColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const column = board.columns.find((c) => String(c._id) === columnId);
  if (!column) throw new ApiError(404, "Column not found");

  const oldName = column.name;
  column.name = req.body.name;
  await board.save();

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "COLUMN_RENAMED",
    `renamed column "${oldName}" to "${column.name}"`
  );
  io.to(`board:${boardId}`).emit("column:renamed", {
    boardId,
    columnId,
    name: column.name,
  });

  res.json(new ApiResponse(200, "Column renamed", column));
});

export const reorderColumns = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { columnIds } = req.body as { columnIds: string[] };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const colMap = new Map(board.columns.map((c) => [String(c._id), c]));
  const reordered: IColumn[] = [];

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

  board.columns = reordered as any;
  await board.save();

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "COLUMN_RENAMED",
    `reordered board columns`
  );
  io.to(`board:${boardId}`).emit("column:reordered", { boardId, columns: board.columns });

  res.json(new ApiResponse(200, "Columns reordered", formatBoardResponse(board)));
});

export const removeColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const index = board.columns.findIndex((c) => String(c._id) === columnId);
  if (index === -1) throw new ApiError(404, "Column not found");

  const removed = board.columns[index];
  board.columns.splice(index, 1);
  await board.save();
  await Task.deleteMany({ board: boardId, columnId });

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "COLUMN_DELETED",
    `deleted column "${removed.name}"`
  );
  io.to(`board:${boardId}`).emit("column:deleted", { boardId, columnId });

  res.json(new ApiResponse(200, "Column deleted", null));
});

/** Request-based Invitation: Sends pending invitation request & notification */
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { userId, email } = req.body as { userId?: string; email?: string };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  let user = null;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
  } else if (userId) {
    user = await User.findById(userId);
  }
  if (!user) throw new ApiError(404, "User not found with this email");

  const targetUserId = String(user._id);

  if (idOf(board.owner) === targetUserId || board.members.some((m) => idOf(m) === targetUserId)) {
    throw new ApiError(409, "User is already a member of this board");
  }

  const existingInvite = await Invitation.findOne({
    board: board._id,
    invitee: user._id,
    status: "pending",
  });
  if (existingInvite) {
    throw new ApiError(409, "An invitation is already pending for this user");
  }

  const invitation = await Invitation.create({
    board: board._id,
    inviter: req.user!._id,
    invitee: user._id,
    inviteeEmail: user.email,
    status: "pending",
  });

  await invitation.populate([
    { path: "inviter", select: "name email avatar" },
    { path: "invitee", select: "name email avatar" },
    { path: "board", select: "name title description" },
  ]);

  const notif = await Notification.create({
    recipient: user._id,
    sender: req.user!._id,
    type: "BOARD_INVITATION",
    title: "Board Invitation Request",
    message: `${req.user!.name} sent you an invitation request to join board "${board.name}"`,
    board: board._id,
    invitation: invitation._id,
  });

  await notif.populate([
    { path: "sender", select: "name email avatar" },
    { path: "board", select: "name title description" },
    { path: "invitation" },
  ]);

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "MEMBER_ADDED",
    `sent invitation request to ${user.name} (${user.email})`,
    { userId: targetUserId, invitationId: String(invitation._id) }
  );

  io.emit("invite:sent", {
    inviteeId: targetUserId,
    invitation,
  });

  io.to(`user:${targetUserId}`).emit("notification:new", notif);

  res.status(201).json(new ApiResponse(201, "Invitation request sent", invitation));
});

/** Owner Kick Member Endpoint */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, userId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  if (idOf(board.owner) !== uid(req)) {
    throw new ApiError(403, "Only the board owner can kick/remove members");
  }

  const index = board.members.findIndex((member) => String(member) === userId);
  if (index === -1) throw new ApiError(404, "User is not a member of this board");
  board.members.splice(index, 1);
  await board.save();

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "MEMBER_REMOVED",
    `kicked member from the board`,
    { userId }
  );
  io.to(`board:${boardId}`).emit("board:member-removed", { boardId, userId });

  res.json(new ApiResponse(200, "Member kicked successfully", formatBoardResponse(board)));
});

/** Share Link Endpoints */
export const getBoardInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  if (!board.inviteCode) {
    board.inviteCode = generateInviteCode();
    await board.save();
  }

  res.json(new ApiResponse(200, "Invite code fetched", { inviteCode: board.inviteCode }));
});

export const getBoardPreviewByInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { inviteCode } = req.params;

  const board = await Board.findOne({ inviteCode })
    .populate("owner", "name email avatar")
    .select("name description owner members createdAt inviteCode");
  if (!board) throw new ApiError(404, "Invalid or expired board share link");

  res.json(
    new ApiResponse(200, "Board preview fetched", {
      boardId: String(board._id),
      title: board.name,
      description: board.description,
      owner: board.owner,
      membersCount: board.members.length + 1,
      inviteCode: board.inviteCode,
    })
  );
});

export const joinBoardByInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { inviteCode } = req.params;

  const board = await Board.findOne({ inviteCode });
  if (!board) throw new ApiError(404, "Invalid or expired board share link");

  const currentUserId = uid(req);
  const isOwner = idOf(board.owner) === currentUserId;
  const isMember = board.members.some((m) => idOf(m) === currentUserId);

  if (!isOwner && !isMember) {
    board.members.push(req.user!._id as Types.ObjectId);
    await board.save();

    await ActivityService.log(
      req.user!._id,
      String(board._id),
      "MEMBER_ADDED",
      `${req.user!.name} joined board via share link`,
      { userId: currentUserId }
    );

    if (idOf(board.owner) !== currentUserId) {
      const ownerNotif = await Notification.create({
        recipient: board.owner,
        sender: req.user!._id,
        type: "BOARD_INVITATION",
        title: "New Board Member Joined",
        message: `${req.user!.name} joined board "${board.name}" via share link`,
        board: board._id,
      });

      await ownerNotif.populate([
        { path: "sender", select: "name email avatar" },
        { path: "board", select: "name title description" },
      ]);

      io.to(`user:${idOf(board.owner)}`).emit("notification:new", ownerNotif);
    }

    io.to(`board:${String(board._id)}`).emit("board:member-added", {
      boardId: String(board._id),
      member: { _id: currentUserId, name: req.user!.name, email: req.user!.email },
    });
    io.emit("workspace:member-added", {
      boardId: String(board._id),
      member: { _id: currentUserId, name: req.user!.name, email: req.user!.email },
    });
  }

  await board.populate([
    { path: "owner", select: "name email avatar" },
    { path: "members", select: "name email avatar" },
  ]);

  res.json(
    new ApiResponse(200, "Successfully joined board", {
      boardId: String(board._id),
      board: formatBoardResponse(board),
    })
  );
});

export const joinWorkspaceByNameOrId = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceName, boardId, inviteCode } = req.body as {
    workspaceName?: string;
    boardId?: string;
    inviteCode?: string;
  };

  let board = null;
  if (inviteCode) {
    board = await Board.findOne({ inviteCode });
  } else if (boardId) {
    board = await Board.findById(boardId);
  } else if (workspaceName) {
    board = await Board.findOne({
      $or: [
        { name: new RegExp("^" + workspaceName.trim() + "$", "i") },
        { title: new RegExp("^" + workspaceName.trim() + "$", "i") },
      ],
      isArchived: false,
    });
  }

  if (!board) {
    throw new ApiError(404, "Workspace or project not found");
  }

  const currentUserId = uid(req);
  const isOwner = idOf(board.owner) === currentUserId;
  const isMember = board.members.some((m) => idOf(m) === currentUserId);

  if (!isOwner && !isMember) {
    board.members.push(req.user!._id as Types.ObjectId);
    await board.save();

    await ActivityService.log(
      req.user!._id,
      String(board._id),
      "MEMBER_ADDED",
      `${req.user!.name} accepted invitation and joined "${board.name}"`,
      { userId: currentUserId }
    );

    if (idOf(board.owner) !== currentUserId) {
      const ownerNotif = await Notification.create({
        recipient: board.owner,
        sender: req.user!._id,
        type: "BOARD_INVITATION",
        title: "New Team Member Joined",
        message: `${req.user!.name} accepted invitation to join "${board.name}"`,
        board: board._id,
      });

      await ownerNotif.populate([
        { path: "sender", select: "name email avatar" },
        { path: "board", select: "name title description" },
      ]);

      io.to(`user:${idOf(board.owner)}`).emit("notification:new", ownerNotif);
    }

    io.to(`board:${String(board._id)}`).emit("board:member-added", {
      boardId: String(board._id),
      member: { _id: currentUserId, name: req.user!.name, email: req.user!.email },
    });
    io.emit("workspace:member-added", {
      boardId: String(board._id),
      member: { _id: currentUserId, name: req.user!.name, email: req.user!.email },
    });
  }

  await board.populate([
    { path: "owner", select: "name email avatar" },
    { path: "members", select: "name email avatar" },
  ]);

  res.json(
    new ApiResponse(200, "Successfully joined workspace", {
      boardId: String(board._id),
      board: formatBoardResponse(board),
    })
  );
});

export const regenerateBoardInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  if (idOf(board.owner) !== uid(req)) {
    throw new ApiError(403, "Only the board owner can regenerate share links");
  }

  board.inviteCode = generateInviteCode();
  await board.save();

  res.json(new ApiResponse(200, "Share link regenerated", { inviteCode: board.inviteCode }));
});

/** Get current user's pending invitations */
export const getUserPendingInvitations = asyncHandler(async (req: Request, res: Response) => {
  const invitations = await Invitation.find({
    invitee: req.user!._id,
    status: "pending",
  })
    .populate("inviter", "name email avatar")
    .populate("board", "name title description")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, "Pending invitations fetched", invitations));
});

/** Respond to invitation (accept or decline) */
export const respondToInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { invitationId } = req.params;
  const { action } = req.body as { action: "accept" | "decline" };

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw new ApiError(404, "Invitation not found");

  if (String(invitation.invitee) !== uid(req)) {
    throw new ApiError(403, "You can only respond to your own invitations");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(400, `Invitation has already been ${invitation.status}`);
  }

  const board = await Board.findById(invitation.board);
  if (!board) throw new ApiError(404, "Associated board no longer exists");

  if (action === "accept") {
    invitation.status = "accepted";
    await invitation.save();

    if (!board.members.some((m) => idOf(m) === uid(req))) {
      board.members.push(req.user!._id as Types.ObjectId);
      await board.save();
    }

    await board.populate("members", "name email avatar");

    await ActivityService.log(
      req.user!._id,
      String(board._id),
      "MEMBER_ADDED",
      `${req.user!.name} accepted invitation and joined the board`,
      { userId: uid(req) }
    );

    io.to(`board:${String(board._id)}`).emit("board:member-added", {
      boardId: String(board._id),
      member: { _id: uid(req), name: req.user!.name, email: req.user!.email },
    });
  } else {
    invitation.status = "declined";
    await invitation.save();
  }

  await Notification.updateMany(
    { invitation: invitation._id, recipient: req.user!._id },
    { $set: { isRead: true } }
  );

  res.json(
    new ApiResponse(200, `Invitation ${action}ed successfully`, {
      invitation,
      board: formatBoardResponse(board),
    })
  );
});

/** Get all invitations sent for a specific board */
export const getBoardInvitations = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const invitations = await Invitation.find({ board: boardId })
    .populate("inviter", "name email avatar")
    .populate("invitee", "name email avatar")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, "Board invitations fetched", invitations));
});

/** Update member role / RBAC */
export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, userId } = req.params;
  const { role } = req.body as { role: "admin" | "member" | "viewer" };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");

  const currentUserId = uid(req);
  const isOwner = idOf(board.owner) === currentUserId;
  const currentMemberRole = board.memberRoles?.find((mr) => idOf(mr.user) === currentUserId);
  const isAdmin = currentMemberRole?.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Only board owners or admins can modify member permissions");
  }

  if (idOf(board.owner) === userId) {
    throw new ApiError(400, "Cannot change role of the board owner");
  }

  if (!board.memberRoles) board.memberRoles = [];
  const existingRole = board.memberRoles.find((mr) => idOf(mr.user) === userId);
  if (existingRole) {
    existingRole.role = role;
  } else {
    board.memberRoles.push({ user: new Types.ObjectId(userId), role });
  }

  await board.save();

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "MEMBER_UPDATED",
    `updated permission for member to ${role}`,
    { targetUserId: userId, role }
  );

  io.to(`board:${boardId}`).emit("board:member-role-updated", {
    boardId,
    userId,
    role,
  });

  res.json(new ApiResponse(200, "Member role updated successfully", { userId, role }));
});

/** Transfer board ownership */
export const transferOwnership = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { newOwnerId } = req.body as { newOwnerId: string };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  if (idOf(board.owner) !== uid(req)) {
    throw new ApiError(403, "Only the current owner can transfer ownership of this board");
  }

  if (newOwnerId === uid(req)) {
    throw new ApiError(400, "You are already the owner of this board");
  }

  const isMember = board.members.some((m) => idOf(m) === newOwnerId);
  if (!isMember) {
    throw new ApiError(400, "New owner must be an existing member of the board");
  }

  const previousOwnerId = idOf(board.owner);

  // Set new owner
  board.owner = new Types.ObjectId(newOwnerId);

  // Ensure previous owner is in members list with 'admin' role
  if (!board.members.some((m) => idOf(m) === previousOwnerId)) {
    board.members.push(new Types.ObjectId(previousOwnerId));
  }
  if (!board.memberRoles) board.memberRoles = [];
  const prevOwnerRole = board.memberRoles.find((mr) => idOf(mr.user) === previousOwnerId);
  if (prevOwnerRole) {
    prevOwnerRole.role = "admin";
  } else {
    board.memberRoles.push({ user: new Types.ObjectId(previousOwnerId), role: "admin" });
  }

  const newOwnerRole = board.memberRoles.find((mr) => idOf(mr.user) === newOwnerId);
  if (newOwnerRole) {
    newOwnerRole.role = "admin";
  } else {
    board.memberRoles.push({ user: new Types.ObjectId(newOwnerId), role: "admin" });
  }

  await board.save();
  await board.populate([
    { path: "owner", select: "name email avatar" },
    { path: "members", select: "name email avatar" },
    { path: "memberRoles.user", select: "name email avatar" },
  ]);

  const newOwnerUser = await User.findById(newOwnerId);

  await ActivityService.log(
    req.user!._id,
    String(board._id),
    "BOARD_UPDATED",
    `transferred board ownership to ${newOwnerUser?.name || "new owner"}`
  );

  io.to(`board:${boardId}`).emit("board:ownership-transferred", {
    boardId,
    newOwnerId,
    previousOwnerId,
    board: formatBoardResponse(board),
  });

  res.json(new ApiResponse(200, "Ownership transferred successfully", formatBoardResponse(board)));
});

/** Update column WIP limit */
export const updateColumnWipLimit = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;
  const { wipLimit } = req.body as { wipLimit: number | null };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const column = board.columns.find((c) => String(c._id) === columnId);
  if (!column) throw new ApiError(404, "Column not found");

  column.wipLimit = typeof wipLimit === "number" && wipLimit > 0 ? wipLimit : null;
  await board.save();

  io.to(`board:${boardId}`).emit("column:updated", {
    boardId,
    columnId,
    wipLimit: column.wipLimit,
    column,
  });

  res.json(new ApiResponse(200, "Column WIP limit updated", column));
});

/** Archive or unarchive column */
export const archiveColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;
  const { isArchived } = req.body as { isArchived: boolean };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const column = board.columns.find((c) => String(c._id) === columnId);
  if (!column) throw new ApiError(404, "Column not found");

  column.isArchived = isArchived !== false;
  await board.save();

  io.to(`board:${boardId}`).emit("column:archived", {
    boardId,
    columnId,
    isArchived: column.isArchived,
  });

  res.json(new ApiResponse(200, column.isArchived ? "Column archived" : "Column restored", column));
});

/** Get all archives (tasks and columns) for a board */
export const getBoardArchives = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  const archivedTasks = await Task.find({ board: boardId, isArchived: true })
    .populate("assignees", "name email avatar")
    .sort({ updatedAt: -1 });

  const archivedColumns = board.columns.filter((c) => c.isArchived === true);

  res.json(
    new ApiResponse(200, "Board archives fetched", {
      tasks: archivedTasks,
      columns: archivedColumns,
    })
  );
});

/** Restore archived item (task or column) */
export const restoreArchivedItem = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { type, itemId } = req.body as { type: "task" | "column"; itemId: string };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  if (type === "task") {
    const task = await Task.findOne({ _id: itemId, board: boardId });
    if (!task) throw new ApiError(404, "Archived task not found");
    task.isArchived = false;

    // Check if column still exists and is not archived
    const colExists = board.columns.some((c) => String(c._id) === String(task.columnId) && !c.isArchived);
    if (!colExists && board.columns.length > 0) {
      task.columnId = board.columns[0]._id!;
    }
    await task.save();
    await task.populate("assignees", "name email avatar");

    io.to(`board:${boardId}`).emit("task:restored", { boardId, task });
    return res.json(new ApiResponse(200, "Task restored successfully", task));
  } else if (type === "column") {
    const column = board.columns.find((c) => String(c._id) === itemId);
    if (!column) throw new ApiError(404, "Column not found");
    column.isArchived = false;
    await board.save();

    io.to(`board:${boardId}`).emit("column:restored", { boardId, column });
    return res.json(new ApiResponse(200, "Column restored successfully", column));
  }

  throw new ApiError(400, "Invalid archive item type");
});

/** Permanently delete archived item (task or column) */
export const permanentDeleteArchivedItem = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { type, itemId } = req.body as { type: "task" | "column"; itemId: string };

  const board = await Board.findById(boardId);
  if (!board) throw new ApiError(404, "Board not found");
  assertBoardAccess(board, uid(req));

  if (type === "task") {
    const task = await Task.findOne({ _id: itemId, board: boardId });
    if (!task) throw new ApiError(404, "Task not found");
    await Comment.deleteMany({ task: itemId });
    await Notification.deleteMany({ task: itemId });
    await task.deleteOne();

    return res.json(new ApiResponse(200, "Task permanently deleted", null));
  } else if (type === "column") {
    const colIndex = board.columns.findIndex((c) => String(c._id) === itemId);
    if (colIndex === -1) throw new ApiError(404, "Column not found");

    board.columns.splice(colIndex, 1);
    await board.save();
    await Task.deleteMany({ board: boardId, columnId: itemId });

    return res.json(new ApiResponse(200, "Column permanently deleted", null));
  }

  throw new ApiError(400, "Invalid archive item type");
});
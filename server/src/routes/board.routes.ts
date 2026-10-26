import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createBoardSchema,
  updateBoardSchema,
  addColumnSchema,
  renameColumnSchema,
  addMemberSchema,
  respondInvitationSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
  setWipLimitSchema,
} from "../validators/board.validator";
import { createTaskSchema } from "../validators/task.validator";
import * as boardController from "../controllers/board.controller";
import * as taskController from "../controllers/task.controller";
import { getBoardActivities } from "../controllers/activity.controller";

const router = Router();

// Public Board Preview Endpoint
router.get("/join-preview/:inviteCode", boardController.getBoardPreviewByInviteCode);

router.use(authenticate);

// Authenticated Join Link Endpoints
router.post("/join-code/:inviteCode", boardController.joinBoardByInviteCode);
router.post("/join-workspace", boardController.joinWorkspaceByNameOrId);

// User Invitations Endpoints
router.get("/invitations/pending", boardController.getUserPendingInvitations);
router.post(
  "/invitations/:invitationId/respond",
  validate(respondInvitationSchema),
  boardController.respondToInvitation
);

// Board Endpoints
router.post("/", validate(createBoardSchema), boardController.createBoard);
router.get("/", boardController.getMyBoards);
router.get("/workspace/members", boardController.getWorkspaceMembers);
router.get("/dashboard/stats", boardController.getDashboardStats);
router.get("/:boardId", boardController.getBoardById);
router.patch("/:boardId", validate(updateBoardSchema), boardController.updateBoard);
router.delete("/:boardId", boardController.deleteBoard);

// Columns
router.post("/:boardId/columns", validate(addColumnSchema), boardController.addColumn);
router.patch("/:boardId/columns/reorder", boardController.reorderColumns);
router.patch("/:boardId/columns/:columnId", validate(renameColumnSchema), boardController.renameColumn);
router.patch("/:boardId/columns/:columnId/wip-limit", validate(setWipLimitSchema), boardController.updateColumnWipLimit);
router.patch("/:boardId/columns/:columnId/archive", boardController.archiveColumn);
router.delete("/:boardId/columns/:columnId", boardController.removeColumn);

// Members & RBAC & Ownership
router.post("/:boardId/members", validate(addMemberSchema), boardController.addMember);
router.patch("/:boardId/members/:userId/role", validate(updateMemberRoleSchema), boardController.updateMemberRole);
router.post("/:boardId/transfer-ownership", validate(transferOwnershipSchema), boardController.transferOwnership);
router.delete("/:boardId/members/:userId", boardController.removeMember);
router.get("/:boardId/invitations", boardController.getBoardInvitations);
router.get("/:boardId/invite-code", boardController.getBoardInviteCode);
router.post("/:boardId/regenerate-invite-code", boardController.regenerateBoardInviteCode);

// Archives Management
router.get("/:boardId/archives", boardController.getBoardArchives);
router.post("/:boardId/archives/restore", boardController.restoreArchivedItem);
router.delete("/:boardId/archives/permanent", boardController.permanentDeleteArchivedItem);

// Tasks under board context
router.get("/:boardId/tasks", taskController.getBoardTasks);
router.post(
  "/:boardId/columns/:columnId/tasks",
  validate(createTaskSchema),
  taskController.createTask
);

// Activity feed under board context
router.get("/:boardId/activity", getBoardActivities);

export default router;
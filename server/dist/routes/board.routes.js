"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const board_validator_1 = require("../validators/board.validator");
const task_validator_1 = require("../validators/task.validator");
const boardController = __importStar(require("../controllers/board.controller"));
const taskController = __importStar(require("../controllers/task.controller"));
const activity_controller_1 = require("../controllers/activity.controller");
const router = (0, express_1.Router)();
// Public Board Preview Endpoint
router.get("/join-preview/:inviteCode", boardController.getBoardPreviewByInviteCode);
router.use(auth_middleware_1.authenticate);
// Authenticated Join Link Endpoints
router.post("/join-code/:inviteCode", boardController.joinBoardByInviteCode);
router.post("/join-workspace", boardController.joinWorkspaceByNameOrId);
// User Invitations Endpoints
router.get("/invitations/pending", boardController.getUserPendingInvitations);
router.post("/invitations/:invitationId/respond", (0, validate_middleware_1.validate)(board_validator_1.respondInvitationSchema), boardController.respondToInvitation);
// Board Endpoints
router.post("/", (0, validate_middleware_1.validate)(board_validator_1.createBoardSchema), boardController.createBoard);
router.get("/", boardController.getMyBoards);
router.get("/workspace/members", boardController.getWorkspaceMembers);
router.get("/dashboard/stats", boardController.getDashboardStats);
router.get("/:boardId", boardController.getBoardById);
router.patch("/:boardId", (0, validate_middleware_1.validate)(board_validator_1.updateBoardSchema), boardController.updateBoard);
router.delete("/:boardId", boardController.deleteBoard);
// Columns
router.post("/:boardId/columns", (0, validate_middleware_1.validate)(board_validator_1.addColumnSchema), boardController.addColumn);
router.patch("/:boardId/columns/reorder", boardController.reorderColumns);
router.patch("/:boardId/columns/:columnId", (0, validate_middleware_1.validate)(board_validator_1.renameColumnSchema), boardController.renameColumn);
router.patch("/:boardId/columns/:columnId/wip-limit", (0, validate_middleware_1.validate)(board_validator_1.setWipLimitSchema), boardController.updateColumnWipLimit);
router.patch("/:boardId/columns/:columnId/archive", boardController.archiveColumn);
router.delete("/:boardId/columns/:columnId", boardController.removeColumn);
// Members & RBAC & Ownership
router.post("/:boardId/members", (0, validate_middleware_1.validate)(board_validator_1.addMemberSchema), boardController.addMember);
router.patch("/:boardId/members/:userId/role", (0, validate_middleware_1.validate)(board_validator_1.updateMemberRoleSchema), boardController.updateMemberRole);
router.post("/:boardId/transfer-ownership", (0, validate_middleware_1.validate)(board_validator_1.transferOwnershipSchema), boardController.transferOwnership);
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
router.post("/:boardId/columns/:columnId/tasks", (0, validate_middleware_1.validate)(task_validator_1.createTaskSchema), taskController.createTask);
// Activity feed under board context
router.get("/:boardId/activity", activity_controller_1.getBoardActivities);
exports.default = router;
//# sourceMappingURL=board.routes.js.map
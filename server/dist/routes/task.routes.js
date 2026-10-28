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
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const task_validator_1 = require("../validators/task.validator");
const taskController = __importStar(require("../controllers/task.controller"));
const commentController = __importStar(require("../controllers/comment.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
const createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, "Comment cannot be empty").max(2000),
});
router.get("/board/:boardId", taskController.getBoardTasks);
router.get("/board/:boardId/column/:columnId", taskController.getColumnTasks);
router.post("/board/:boardId/column/:columnId", (0, validate_middleware_1.validate)(task_validator_1.createTaskSchema), taskController.createTask);
router.patch("/:taskId", (0, validate_middleware_1.validate)(task_validator_1.updateTaskSchema), taskController.updateTask);
router.patch("/:taskId/move", (0, validate_middleware_1.validate)(task_validator_1.moveTaskSchema), taskController.moveTask);
router.patch("/:taskId/archive", taskController.archiveTask);
router.delete("/:taskId", taskController.deleteTask);
// Comment routes under task context (matching client/src/api/commentApi.ts)
router.get("/:taskId/comments", commentController.getCommentsByTask);
router.post("/:taskId/comments", (0, validate_middleware_1.validate)(createCommentSchema), commentController.createComment);
exports.default = router;
//# sourceMappingURL=task.routes.js.map
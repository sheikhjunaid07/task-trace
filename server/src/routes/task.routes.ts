import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} from "../validators/task.validator";
import * as taskController from "../controllers/task.controller";
import * as commentController from "../controllers/comment.controller";

const router = Router();

router.use(authenticate);

const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

router.get("/board/:boardId", taskController.getBoardTasks);
router.get("/board/:boardId/column/:columnId", taskController.getColumnTasks);
router.post(
  "/board/:boardId/column/:columnId",
  validate(createTaskSchema),
  taskController.createTask
);
router.patch("/:taskId", validate(updateTaskSchema), taskController.updateTask);
router.patch("/:taskId/move", validate(moveTaskSchema), taskController.moveTask);
router.patch("/:taskId/archive", taskController.archiveTask);
router.delete("/:taskId", taskController.deleteTask);

// Comment routes under task context (matching client/src/api/commentApi.ts)
router.get("/:taskId/comments", commentController.getCommentsByTask);
router.post(
  "/:taskId/comments",
  validate(createCommentSchema),
  commentController.createComment
);

export default router;
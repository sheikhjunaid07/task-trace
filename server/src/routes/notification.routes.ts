import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getUserNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:notificationId/read", notificationController.markAsRead);
router.delete("/clear-all", notificationController.clearAllNotifications);
router.delete("/:notificationId", notificationController.deleteNotification);

export default router;

import type { NotificationType } from "../types";

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  boardId?: string;
  taskId?: string;
  timestamp: number;
}

// Global helper to trigger toast programmatically
export const showToast = (toast: Omit<ToastItem, "id" | "timestamp">) => {
  const event = new CustomEvent("app:toast", {
    detail: {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    },
  });
  window.dispatchEvent(event);
};

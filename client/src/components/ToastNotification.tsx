import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  CheckSquare,
  ArrowRightCircle,
  Edit3,
  Trash2,
  Mail,
  AtSign,
  Users,
  Bell,
} from "lucide-react";
import { getSocket } from "../sockets/socket";
import type { AppNotification, NotificationType } from "../types";

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

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const SingleToastCard: React.FC<SingleToastProps> = ({ toast, onDismiss }) => {
  // Automatically disappear after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getToastIcon = (type: NotificationType) => {
    switch (type) {
      case "PROJECT_CREATED":
        return <FolderKanban className="w-4 h-4 text-purple-400" />;
      case "TASK_CREATED":
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case "TASK_MOVED":
        return <ArrowRightCircle className="w-4 h-4 text-amber-400" />;
      case "TASK_UPDATED":
        return <Edit3 className="w-4 h-4 text-sky-400" />;
      case "TASK_DELETED":
      case "PROJECT_DELETED":
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case "BOARD_INVITATION":
        return <Mail className="w-4 h-4 text-amber-400" />;
      case "TASK_MENTION":
        return <AtSign className="w-4 h-4 text-indigo-400" />;
      case "MEMBER_JOINED":
        return <Users className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  const getStyleConfig = (type: NotificationType) => {
    switch (type) {
      case "PROJECT_CREATED":
        return {
          cardBg: "bg-card/95 border-purple-500/40 shadow-purple-950/20",
          iconBg: "bg-purple-500/15 border-purple-500/30",
          titleColor: "text-purple-300",
        };
      case "TASK_CREATED":
        return {
          cardBg: "bg-card/95 border-emerald-500/40 shadow-emerald-950/20",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          titleColor: "text-emerald-300",
        };
      case "TASK_MOVED":
        return {
          cardBg: "bg-card/95 border-amber-500/40 shadow-amber-950/20",
          iconBg: "bg-amber-500/15 border-amber-500/30",
          titleColor: "text-amber-300",
        };
      case "TASK_UPDATED":
        return {
          cardBg: "bg-card/95 border-sky-500/40 shadow-sky-950/20",
          iconBg: "bg-sky-500/15 border-sky-500/30",
          titleColor: "text-sky-300",
        };
      case "TASK_DELETED":
      case "PROJECT_DELETED":
        return {
          cardBg: "bg-card/95 border-rose-500/40 shadow-rose-950/20",
          iconBg: "bg-rose-500/15 border-rose-500/30",
          titleColor: "text-rose-300",
        };
      case "BOARD_INVITATION":
      case "TASK_MENTION":
        return {
          cardBg: "bg-card/95 border-indigo-500/40 shadow-indigo-950/20",
          iconBg: "bg-indigo-500/15 border-indigo-500/30",
          titleColor: "text-indigo-300",
        };
      default:
        return {
          cardBg: "bg-card/95 border-white/20 shadow-black/20",
          iconBg: "bg-white/10 border-white/20",
          titleColor: "text-purple-300",
        };
    }
  };

  const style = getStyleConfig(toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`pointer-events-none relative p-3.5 rounded-2xl backdrop-blur-xl border shadow-xl flex items-start gap-3 select-none cursor-default ${style.cardBg}`}
    >
      {/* Operation Icon */}
      <div
        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${style.iconBg}`}
      >
        {getToastIcon(toast.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <h5 className={`text-xs font-bold truncate ${style.titleColor}`}>
            {toast.title}
          </h5>
          <span className="text-[10px] text-mute shrink-0">Just now</span>
        </div>
        <p className="text-xs text-ink/90 mt-0.5 font-medium line-clamp-2 leading-relaxed">
          {toast.message}
        </p>
      </div>
    </motion.div>
  );
};

export const ToastNotificationContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const recentDedupeRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((item: Omit<ToastItem, "id" | "timestamp">) => {
    // Dedupe by type + quoted entity name if present, or by title
    const entityMatch = item.message.match(/"([^"]+)"/)?.[1]?.toLowerCase().trim();
    const dedupeKey = entityMatch
      ? `${item.type}:${entityMatch}`
      : `${item.type}:${item.title.toLowerCase().trim()}`;

    const now = Date.now();
    const lastSeen = recentDedupeRef.current.get(dedupeKey);

    // Prevent duplicate toast if identical action within 3s
    if (lastSeen && now - lastSeen < 3000) {
      return;
    }
    recentDedupeRef.current.set(dedupeKey, now);

    const newToast: ToastItem = {
      ...item,
      id: `toast_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 2)]);
  }, []);

  // Listen to custom window toast events
  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        addToast(customEvent.detail);
      }
    };

    window.addEventListener("app:toast", handleCustomToast);
    return () => window.removeEventListener("app:toast", handleCustomToast);
  }, [addToast]);

  // Listen to Socket.IO real-time notification events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSocketNotification = (notif: AppNotification) => {
      const bId =
        typeof notif.board === "object" && notif.board !== null
          ? (notif.board as any)._id
          : notif.board;
      const tId =
        typeof notif.task === "object" && notif.task !== null
          ? (notif.task as any)._id
          : notif.task;

      addToast({
        type: notif.type,
        title: notif.title,
        message: notif.message,
        boardId: bId,
        taskId: tId,
      });
    };

    socket.on("notification:new", handleSocketNotification);
    return () => {
      socket.off("notification:new", handleSocketNotification);
    };
  }, [addToast]);

  return (
    <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none select-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <SingleToastCard
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

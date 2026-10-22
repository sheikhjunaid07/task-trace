import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, User, Column } from "../../../types";
import { useAppDispatch } from "../../../app/hooks";
import { setActiveTaskId } from "../../board/boardSlice";
import { useDeleteTaskMutation } from "../../../api/taskApi";
import {
  MessageSquare,
  Trash2,
  User as UserIcon,
  Check,
  Move,
  Calendar,
} from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";
import { priorityLabel } from "../../../utils/columnTheming";
import { showToast } from "../../../components/ToastNotification";
import { ConfirmDeleteModal } from "../../../components/ConfirmDeleteModal";
import type {
  TypingUser,
  DraggingUser,
} from "../../../sockets/useSocketEvents";

interface TaskCardProps {
  task: Task;
  currentColumn?: Column;
  columns?: Column[];
  boardId?: string;
  typingUsers?: TypingUser[];
  draggingUser?: DraggingUser;
  isOverlay?: boolean;
}

const AVATAR_COLORS = [
  "bg-fuchsia-600",
  "bg-pink-600",
  "bg-emerald-600",
  "bg-sky-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-indigo-600",
  "bg-teal-600",
];

const getAvatarColorClass = (name: string, index: number = 0) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash + index) % AVATAR_COLORS.length];
};

const formatDueDate = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  currentColumn,
  columns = [],
  boardId,
  typingUsers,
  draggingUser,
  isOverlay = false,
}) => {
  const dispatch = useAppDispatch();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { task },
    disabled: isOverlay,
  });

  const assignees = (task.assignees || []) as User[];
  const primaryAssignee = assignees.length > 0 ? assignees[0] : null;
  const critical = task.priority === "critical";
  const isBeingMoved = !!draggingUser;

  // Derive column information
  const activeCol =
    columns.find((c) => c._id === task.columnId) || currentColumn;
  const colName = activeCol?.name || "To Do";
  const isCompleted =
    colName.toLowerCase().includes("done") ||
    colName.toLowerCase().includes("complete");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  } as React.CSSProperties;

  const handleCardClick = () => {
    dispatch(setActiveTaskId(task._id));
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setActiveTaskId(task._id));
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const resolvedBoardId =
    boardId ||
    (typeof task.board === 'string' ? task.board : (task.board as any)?._id) ||
    '';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTask({ taskId: task._id, boardId: resolvedBoardId }).unwrap();
      showToast({
        type: 'TASK_DELETED',
        title: 'Task Deleted',
        message: `Task "${task.title}" deleted`,
      });
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast({
        type: 'TASK_DELETED',
        title: 'Delete Failed',
        message: 'Failed to delete task',
      });
    }
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
      case "high":
        return "border-amber-500/40 bg-amber-500/15 text-amber-400";
      case "medium":
        return "border-indigo-500/40 bg-indigo-500/15 text-indigo-300";
      case "low":
        return "border-slate-600/40 bg-slate-700/25 text-slate-400";
      default:
        return "border-slate-600/40 bg-slate-700/25 text-slate-400";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={handleCardClick}
      className={`group task-card p-3 sm:p-3.5 cursor-pointer relative overflow-hidden transition-all rounded-xl select-none border border-white/[0.08] shadow-sm hover:shadow-md ${
        critical ? "task-critical" : ""
      } ${
        isBeingMoved
          ? "ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-950/20"
          : ""
      }`}
    >
      {/* Live Movement Indicator */}
      {isBeingMoved && (
        <div className="mb-2 flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
          <Move className="w-3 h-3 text-amber-400 animate-spin" />
          <span className="truncate">Moved by {draggingUser.userName}...</span>
        </div>
      )}

      {/* Task Title */}
      <h4 className="text-[13.5px] sm:text-sm font-semibold text-white/95 line-clamp-2 mb-2 leading-snug tracking-tight hover:text-white transition-colors">
        {task.title}
      </h4>

      {/* Urgency & Completed Badges + Live Typing Indicator (Left) & Date (Right, aligned with priority and above delete button) */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Urgency Badge */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase border shrink-0 ${getPriorityStyle(
              task.priority,
            )}`}
          >
            {priorityLabel(task.priority).toUpperCase()}
          </span>

          {/* Completed Badge (Shown when in Done column, matching Image 2) */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
              <span>COMPLETED</span>
            </span>
          )}

          {typingUsers && typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}
        </div>

        {/* Due Date Indicator (Aligned with priority, positioned directly ABOVE the delete button) */}
        {task.dueDate && (
          <div
            className="flex items-center space-x-1 text-[11px] font-medium text-slate-400 shrink-0 select-none"
            title={`Due date: ${new Date(task.dueDate).toLocaleDateString([], {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}`}
          >
            <Calendar className="w-3 h-3 text-slate-400/80" />
            <span>{formatDueDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Assignees, Comment Button (Left), Delete Option (Right) */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] gap-2">
        {/* Assignees & Comments */}
        <div className="flex items-center space-x-2 min-w-0">
          {/* Overlapping Avatars or Unassigned Indicator */}
          {assignees.length > 0 ? (
            <div className="flex items-center space-x-1.5 min-w-0">
              <div className="flex items-center -space-x-1.5 overflow-hidden shrink-0">
                {assignees.slice(0, 3).map((user, idx) => (
                  <div
                    key={user._id || idx}
                    title={user.name}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-[#16171d] shadow-sm shrink-0 ${getAvatarColorClass(
                      user.name,
                      idx,
                    )}`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (user.name || "U").charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {assignees.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-[#16171d] flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
              <span
                className="text-[11px] font-medium text-slate-300 truncate max-w-[70px] sm:max-w-[90px]"
                title={primaryAssignee?.name}
              >
                {primaryAssignee?.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-400 min-w-0">
              <div className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
                <UserIcon className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-medium text-slate-400 truncate max-w-[70px]">
                Unassigned
              </span>
            </div>
          )}

          {/* Comment Count / Button */}
          <button
            type="button"
            onClick={handleCommentClick}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center space-x-1 text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title={`${task.commentCount ?? 0} Comments (Click to view)`}
          >
            <MessageSquare className="w-3 h-3" />
            <span className="text-[11px] font-semibold">
              {task.commentCount ?? 0}
            </span>
          </button>
        </div>

        {/* Delete Option (Positioned directly below the Due Date) */}
        <button
          type="button"
          onClick={handleDeleteClick}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          disabled={isDeleting}
          className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        title="Are you want to delete?"
        itemName={task.title}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

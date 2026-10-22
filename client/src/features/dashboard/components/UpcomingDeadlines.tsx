import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  ArrowRight,
  AlertTriangle,
  Flame,
  CalendarCheck,
  FolderKanban,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface TaskDeadlineItem {
  _id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string | null;
  columnId?: string;
  status?: "todo" | "progress" | "done";
  board?:
    | {
        _id: string;
        name?: string;
        title?: string;
      }
    | string;
  assignees?: Array<{
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  }>;
}

interface UpcomingDeadlinesProps {
  tasks: TaskDeadlineItem[];
  isLoading?: boolean;
  selectedProjectId?: string | null;
  selectedProjectName?: string;
}

type FilterTab = "all" | "under10" | "after10" | "overdue";
type SortOption = "urgency" | "priority";

/**
 * Calculates calendar day difference between target date and today (ignoring time-of-day offsets).
 */
export const calculateDaysRemaining = (dueDateStr?: string | null): number => {
  if (!dueDateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Priority rank for sorting tasks when sort by priority is chosen.
 */
const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  tasks = [],
  isLoading = false,
  selectedProjectId,
  selectedProjectName,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("urgency");
  const [scope, setScope] = useState<"project" | "workspace">("workspace");

  // Filter tasks based on project scope if a project is selected
  const scopedTasks = useMemo(() => {
    if (!selectedProjectId || scope === "workspace") {
      return tasks;
    }
    return tasks.filter((task) => {
      const bId =
        typeof task.board === "object" && task.board !== null
          ? task.board._id
          : task.board;
      return String(bId) === String(selectedProjectId);
    });
  }, [tasks, selectedProjectId, scope]);

  // Compute days remaining and annotate items
  const annotatedTasks = useMemo(() => {
    return scopedTasks.map((t) => ({
      ...t,
      daysRemaining: calculateDaysRemaining(t.dueDate),
    }));
  }, [scopedTasks]);

  // Group counts for tabs
  const overdueCount = useMemo(
    () => annotatedTasks.filter((t) => t.daysRemaining < 0).length,
    [annotatedTasks],
  );
  const under10Count = useMemo(
    () =>
      annotatedTasks.filter(
        (t) => t.daysRemaining >= 0 && t.daysRemaining <= 10,
      ).length,
    [annotatedTasks],
  );
  const after10Count = useMemo(
    () => annotatedTasks.filter((t) => t.daysRemaining > 10).length,
    [annotatedTasks],
  );

  // Apply tab filtering
  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case "overdue":
        return annotatedTasks.filter((t) => t.daysRemaining < 0);
      case "under10":
        return annotatedTasks.filter(
          (t) => t.daysRemaining >= 0 && t.daysRemaining <= 10,
        );
      case "after10":
        return annotatedTasks.filter((t) => t.daysRemaining > 10);
      case "all":
      default:
        return annotatedTasks;
    }
  }, [annotatedTasks, activeTab]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === "urgency") {
        // Fewest days remaining first (overdue -> today -> tomorrow -> 10 days -> after 10 days)
        if (a.daysRemaining !== b.daysRemaining) {
          return a.daysRemaining - b.daysRemaining;
        }
        // Tie-breaker: task priority
        return (
          (PRIORITY_ORDER[b.priority || "medium"] || 0) -
          (PRIORITY_ORDER[a.priority || "medium"] || 0)
        );
      } else {
        // Priority first
        const pDiff =
          (PRIORITY_ORDER[b.priority || "medium"] || 0) -
          (PRIORITY_ORDER[a.priority || "medium"] || 0);
        if (pDiff !== 0) return pDiff;
        return a.daysRemaining - b.daysRemaining;
      }
    });
  }, [filteredTasks, sortBy]);

  /**
   * Returns day-wise urgency metadata, visual badges, and dynamic priority level.
   * When days are less, higher urgency priority and vibrant alerting styles are rendered.
   */
  const getDayWiseUrgency = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      const overdueBy = Math.abs(daysRemaining);
      return {
        level: "CRITICAL",
        dayLabel: `Overdue by ${overdueBy}d`,
        tagColor:
          "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/30",
        cardBorder: "border-l-4 border-l-rose-500",
        badge: "🚨 Overdue",
        badgeColor: "bg-rose-950/60 text-rose-300 border-rose-700/50",
        icon: AlertTriangle,
        iconColor: "text-rose-400",
        pulse: true,
      };
    }
    if (daysRemaining === 0) {
      return {
        level: "CRITICAL",
        dayLabel: "Due Today",
        tagColor:
          "bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-950/30",
        cardBorder: "border-l-4 border-l-red-500",
        badge: "🔥 Due Today",
        badgeColor: "bg-red-950/60 text-red-300 border-red-700/50",
        icon: Flame,
        iconColor: "text-red-400",
        pulse: true,
      };
    }
    if (daysRemaining === 1) {
      return {
        level: "HIGH",
        dayLabel: "Due Tomorrow",
        tagColor:
          "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/30",
        cardBorder: "border-l-4 border-l-amber-500",
        badge: "⚡ Tomorrow",
        badgeColor: "bg-amber-950/60 text-amber-300 border-amber-700/50",
        icon: Clock,
        iconColor: "text-amber-400",
        pulse: false,
      };
    }
    if (daysRemaining >= 2 && daysRemaining <= 3) {
      return {
        level: "HIGH",
        dayLabel: `In ${daysRemaining} days`,
        tagColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
        cardBorder: "border-l-4 border-l-orange-500",
        badge: `⏳ ${daysRemaining} days left`,
        badgeColor: "bg-orange-950/60 text-orange-300 border-orange-700/50",
        icon: Clock,
        iconColor: "text-orange-400",
        pulse: false,
      };
    }
    if (daysRemaining >= 4 && daysRemaining <= 7) {
      return {
        level: "MEDIUM",
        dayLabel: `In ${daysRemaining} days`,
        tagColor: "bg-sky-500/20 text-sky-300 border-sky-500/35",
        cardBorder: "border-l-4 border-l-sky-500",
        badge: `📅 ${daysRemaining} days left`,
        badgeColor: "bg-sky-950/60 text-sky-300 border-sky-700/50",
        icon: Calendar,
        iconColor: "text-sky-400",
        pulse: false,
      };
    }
    if (daysRemaining >= 8 && daysRemaining <= 10) {
      return {
        level: "MEDIUM",
        dayLabel: `In ${daysRemaining} days (≤ 10d)`,
        tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/35",
        cardBorder: "border-l-4 border-l-purple-500",
        badge: `🗓️ ${daysRemaining} days left`,
        badgeColor: "bg-purple-950/60 text-purple-300 border-purple-700/50",
        icon: Calendar,
        iconColor: "text-purple-400",
        pulse: false,
      };
    }
    // daysRemaining > 10
    return {
      level: "SCHEDULED",
      dayLabel: `In ${daysRemaining} days (> 10d)`,
      tagColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      cardBorder: "border-l-4 border-l-emerald-600/70",
      badge: `📆 ${daysRemaining} days (Later)`,
      badgeColor: "bg-emerald-950/50 text-emerald-300 border-emerald-700/40",
      icon: CalendarCheck,
      iconColor: "text-emerald-400",
      pulse: false,
    };
  };

  /**
   * Helper for task's own configured priority badge style
   */
  const getTaskPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "high":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "medium":
        return "bg-blue-500/20 text-blue-300 border-blue-500/35";
      case "low":
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/35";
    }
  };

  const handleTaskClick = (task: TaskDeadlineItem) => {
    const bId =
      typeof task.board === "object" && task.board !== null
        ? task.board._id
        : task.board;
    if (bId) {
      navigate(`/boards/${bId}?taskId=${task._id}`);
    }
  };

  return (
    <div className="glass-card p-5 sm:p-6 flex flex-col justify-between border border-edge shadow-md rounded-2xl">
      <div>
        {/* ─── Header: Title & View All Projects Link ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-ink font-bold text-base sm:text-lg tracking-tight">
                  Upcoming Deadlines
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {annotatedTasks.length}
                </span>
              </div>
              <p className="text-xs text-mute font-medium">
                Day-wise prioritized tasks across your workspaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Sort Toggle */}
            <button
              onClick={() =>
                setSortBy((prev) =>
                  prev === "urgency" ? "priority" : "urgency",
                )
              }
              title={`Sorting by ${sortBy === "urgency" ? "Urgency (Days Left)" : "Priority"}`}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface/80 border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <ArrowUpDown className="w-3 h-3 text-purple-400" />
              <span>
                {sortBy === "urgency" ? "Sort: Days Left" : "Sort: Priority"}
              </span>
            </button>

            <Link
              to="/boards"
              className="text-xs font-bold text-purple-300 hover:text-white hover:underline flex items-center gap-1 transition-colors ml-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ─── Project Scoping Switch (if a specific project is selected) ─── */}
        {selectedProjectId && (
          <div className="mb-4 flex items-center justify-between p-2 rounded-xl bg-surface/40 border border-white/5 text-xs">
            <span className="text-mute flex items-center gap-1.5 font-medium">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              Filter by scope:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScope("project")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  scope === "project"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-mute hover:text-ink"
                }`}
              >
                {selectedProjectName || "Current Project"}
              </button>
              <button
                onClick={() => setScope("workspace")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                  scope === "workspace"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-mute hover:text-ink"
                }`}
              >
                All Projects
              </button>
            </div>
          </div>
        )}

        {/* ─── Filter Tabs: All, <= 10 Days, > 10 Days, Overdue ─── */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 p-1 rounded-xl bg-surface/50 border border-white/10 text-xs font-semibold">
          {/* Tab 1: All */}
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 min-w-[70px] py-1.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "all"
                ? "bg-purple-600 text-white shadow-md"
                : "text-mute hover:text-ink hover:bg-white/5"
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "all"
                  ? "bg-white/20 text-white"
                  : "bg-surface text-mute"
              }`}
            >
              {annotatedTasks.length}
            </span>
          </button>

          {/* Tab 2: <= 10 Days (Priority / Soon) */}
          <button
            onClick={() => setActiveTab("under10")}
            className={`flex-1 min-w-[105px] py-1.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "under10"
                ? "bg-amber-600 text-white shadow-md"
                : "text-mute hover:text-ink hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-1">
              <span>≤ 10 Days</span>
              <span className="hidden sm:inline text-[10px] font-normal opacity-85">
                (Priority)
              </span>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "under10"
                  ? "bg-white/20 text-white"
                  : "bg-surface text-amber-400"
              }`}
            >
              {under10Count}
            </span>
          </button>

          {/* Tab 3: > 10 Days (Later) */}
          <button
            onClick={() => setActiveTab("after10")}
            className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "after10"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-mute hover:text-ink hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-1">
              <span>&gt; 10 Days</span>
              <span className="hidden sm:inline text-[10px] font-normal opacity-85">
                (Later)
              </span>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "after10"
                  ? "bg-white/20 text-white"
                  : "bg-surface text-emerald-400"
              }`}
            >
              {after10Count}
            </span>
          </button>

          {/* Tab 4: Overdue (only visible if any exist) */}
          {overdueCount > 0 && (
            <button
              onClick={() => setActiveTab("overdue")}
              className={`py-1.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "overdue"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-rose-400 hover:text-rose-200 hover:bg-rose-500/10"
              }`}
            >
              <span>Overdue</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-200 font-bold">
                {overdueCount}
              </span>
            </button>
          )}
        </div>

        {/* ─── Tasks List ─── */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-18 skeleton rounded-xl" />
            ))}
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-mute mb-3">
              <CalendarCheck className="w-6 h-6 text-purple-400/60" />
            </div>
            <p className="text-sm font-semibold text-ink">
              {activeTab === "under10"
                ? "No deadlines due within 10 days"
                : activeTab === "after10"
                  ? "No deadlines scheduled after 10 days"
                  : activeTab === "overdue"
                    ? "No overdue task deadlines! Excellent work."
                    : "No upcoming task deadlines found in this workspace."}
            </p>
            <p className="text-xs text-mute mt-1 max-w-xs">
              Assign due dates in task cards to track deadlines and stay
              organized day-by-day.
            </p>
            <Link
              to="/boards"
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all inline-flex items-center gap-1.5"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence initial={false}>
              {sortedTasks.map((task) => {
                const urgency = getDayWiseUrgency(task.daysRemaining);
                const boardName =
                  typeof task.board === "object" && task.board !== null
                    ? task.board.name || task.board.title
                    : "Project";
                const boardId =
                  typeof task.board === "object" && task.board !== null
                    ? task.board._id
                    : task.board;
                const formattedDate = task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";

                const UrgencyIcon = urgency.icon;

                return (
                  <motion.div
                    key={task._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => handleTaskClick(task)}
                    className={`group relative p-3 sm:p-3.5 rounded-xl bg-surface/70 hover:bg-surface border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md ${urgency.cardBorder}`}
                  >
                    {/* Left side: Task Title, Project badge, Priority & Day-wise priority tag */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-ink group-hover:text-purple-400 transition-colors truncate">
                          {task.title}
                        </span>

                        {/* Day-wise Priority Level Tag */}
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${urgency.tagColor}`}
                        >
                          {urgency.pulse && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                          )}
                          <span>{urgency.level} PRIORITY</span>
                        </span>

                        {/* Task Priority Badge (critical, high, medium, low) */}
                        {task.priority && (
                          <span
                            className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-md border ${getTaskPriorityBadge(
                              task.priority,
                            )}`}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>

                      {/* Sub-row: Project name & Due date text */}
                      <div className="flex items-center gap-3 text-xs text-mute flex-wrap">
                        {boardId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/boards/${boardId}`);
                            }}
                            className="inline-flex items-center gap-1 text-ink/80 hover:text-purple-400 hover:underline transition-colors font-medium"
                          >
                            <FolderKanban className="w-3.5 h-3.5 text-purple-400/80" />
                            <span>{boardName}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-ink/80">
                            <FolderKanban className="w-3.5 h-3.5 text-purple-400/80" />
                            <span>{boardName}</span>
                          </span>
                        )}

                        <span className="text-mute/40">•</span>

                        <span className="text-mute font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-400/70" />
                          <span>{formattedDate}</span>
                        </span>

                        {task.status && (
                          <>
                            <span className="text-mute/40">•</span>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-surface border border-edge text-mute capitalize">
                              {task.status === "progress"
                                ? "In Progress"
                                : task.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side: Day-wise Countdown Badge & Arrow */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${urgency.badgeColor}`}
                      >
                        <UrgencyIcon
                          className={`w-3.5 h-3.5 ${urgency.iconColor}`}
                        />
                        <span>{urgency.dayLabel}</span>
                      </div>

                      <div className="w-6 h-6 rounded-lg bg-white/5 group-hover:bg-purple-500/20 group-hover:text-purple-300 flex items-center justify-center text-slate-400 transition-colors">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Footer: Summary Note ─── */}
      <div className="mt-4 pt-3 border-t border-edge flex items-center justify-between text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Fewer days = Higher priority in schedule</span>
        </span>

        {annotatedTasks.length > 0 && (
          <span className="font-semibold text-slate-400">
            {under10Count} soon (≤ 10d) • {after10Count} scheduled (&gt; 10d)
          </span>
        )}
      </div>
    </div>
  );
};

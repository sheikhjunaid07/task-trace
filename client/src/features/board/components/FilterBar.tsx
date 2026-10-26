import React, { useEffect, useRef } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  User as UserIcon,
  UserCheck,
  X,
  Keyboard,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  setSearchQuery,
  setPriorityFilter,
  setAssigneeFilter,
  resetFilters,
} from "../boardSlice";
import type { User } from "../../../types";
import { PRIORITY_LABELS } from "../../../utils/columnTheming";

interface FilterBarProps {
  members: User[];
  totalTasksCount?: number;
  filteredTasksCount?: number;
  onOpenShortcuts?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  members,
  totalTasksCount,
  filteredTasksCount,
  onOpenShortcuts,
}) => {
  const dispatch = useAppDispatch();
  const { searchQuery, priorityFilter, assigneeFilter } = useAppSelector(
    (state) => state.board
  );
  const currentUser = useAppSelector((state) => state.auth.user);

  const isMyTasksActive = Boolean(
    currentUser && assigneeFilter === currentUser._id
  );

  const hasActiveFilters =
    searchQuery !== "" || priorityFilter !== "all" || assigneeFilter !== "all";

  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleMyTasks = () => {
    if (!currentUser) return;
    if (isMyTasksActive) {
      dispatch(setAssigneeFilter("all"));
    } else {
      dispatch(setAssigneeFilter(currentUser._id));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        (e.key === "m" || e.key === "M") &&
        !isTyping &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        toggleMyTasks();
      } else if (e.key === "?" && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenShortcuts?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMyTasksActive, currentUser, onOpenShortcuts]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 glass-panel p-3 rounded-2xl border border-white/10">
      {/* Left side: Search input & My Tasks toggle */}
      <div className="flex items-center space-x-2.5 flex-1 min-w-[280px]">
        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (searchQuery) {
                  dispatch(setSearchQuery(""));
                } else {
                  searchInputRef.current?.blur();
                }
              }
            }}
            placeholder="Search tasks..."
            className="input pl-10 pr-9 py-2 text-[13px] text-white placeholder:text-slate-400 font-medium bg-white/5 border-white/15 focus:border-white/30"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                dispatch(setSearchQuery(""));
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear search (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-5 h-5 text-[10px] font-mono font-bold text-slate-400 bg-white/5 border border-white/10 rounded pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Quick 'My Tasks' Toggle */}
        {currentUser && (
          <button
            type="button"
            onClick={toggleMyTasks}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
              isMyTasksActive
                ? "bg-accent/20 border-accent/40 text-accent shadow-sm"
                : "glass-panel bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
            title="Toggle only tasks assigned to me (Shortcut: M)"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Tasks</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-black/25 ml-0.5">
              M
            </kbd>
          </button>
        )}

        {/* Filtered Count Indicator */}
        {hasActiveFilters &&
          totalTasksCount !== undefined &&
          filteredTasksCount !== undefined && (
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>
                {filteredTasksCount} of {totalTasksCount} tasks
              </span>
            </div>
          )}
      </div>

      {/* Right side: Priority, Assignee Dropdowns, Reset, & Shortcuts */}
      <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
        {/* Priority Filter */}
        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-white/10 bg-white/5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={priorityFilter}
            onChange={(e) => dispatch(setPriorityFilter(e.target.value as any))}
            className="bg-transparent text-xs font-semibold cursor-pointer text-white focus:outline-none"
          >
            <option value="all" className="bg-slate-900 text-white">
              All Priorities
            </option>
            <option value="critical" className="bg-slate-900 text-white">
              {PRIORITY_LABELS.critical} Priority
            </option>
            <option value="high" className="bg-slate-900 text-white">
              {PRIORITY_LABELS.high} Priority
            </option>
            <option value="medium" className="bg-slate-900 text-white">
              {PRIORITY_LABELS.medium} Priority
            </option>
            <option value="low" className="bg-slate-900 text-white">
              {PRIORITY_LABELS.low} Priority
            </option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-white/10 bg-white/5">
          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={assigneeFilter}
            onChange={(e) => dispatch(setAssigneeFilter(e.target.value))}
            className="bg-transparent text-xs font-semibold cursor-pointer text-white focus:outline-none"
          >
            <option value="all" className="bg-slate-900 text-white">
              All Assignees
            </option>
            {members.map((m) => (
              <option
                key={m._id}
                value={m._id}
                className="bg-slate-900 text-white"
              >
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => dispatch(resetFilters())}
            className="flex items-center space-x-1 text-xs font-semibold btn-danger px-2.5 py-2 rounded-xl transition-colors text-white cursor-pointer"
            title="Reset all search & filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {/* Keyboard Shortcuts Guide Button */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="w-8 h-8 rounded-xl glass-panel bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

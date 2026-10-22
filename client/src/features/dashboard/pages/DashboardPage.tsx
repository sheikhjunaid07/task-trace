import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetDashboardStatsQuery,
  useGetBoardsQuery,
  useCreateBoardMutation,
} from '../../../api/boardApi';
import { useAppSelector } from '../../../app/hooks';
import {
  FolderKanban,
  Clock,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  X,
  Users,
  AlertCircle,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { UpcomingDeadlines } from '../components/UpcomingDeadlines';
import { showToast } from '../../../components/ToastNotification';

export const DashboardPage: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const selectedProjectId = useAppSelector((state) => state.board.selectedProjectId);
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useGetDashboardStatsQuery();
  const { data: boardsData, isLoading: isBoardsLoading, refetch: refetchBoards } = useGetBoardsQuery();
  const [createBoard, { isLoading: isCreating }] = useCreateBoardMutation();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');

  const fallbackBoards = boardsData?.data || [];
  const serverStats = statsData?.data;

  // Active project selection
  const currentBoard = fallbackBoards.find((b) => b._id === selectedProjectId);
  const displayTitle = currentBoard
    ? (currentBoard.name || currentBoard.title)
    : (fallbackBoards.length === 1
        ? (fallbackBoards[0].name || fallbackBoards[0].title)
        : (currentUser?.name ? `${currentUser.name}'s Workspace` : 'Project Workspace'));

  const projectsList = serverStats?.projects || fallbackBoards.map((b) => ({
    ...b,
    tasksCount: 0,
    doneCount: 0,
    progressCount: 0,
    todoCount: 0,
    completionRate: 0,
  }));

  const currentProjectStats = selectedProjectId
    ? projectsList.find((p) => p._id === selectedProjectId)
    : null;

  const activeProjectsCount = serverStats?.activeProjects ?? fallbackBoards.length;
  const totalTasksCount = currentProjectStats
    ? currentProjectStats.tasksCount
    : (serverStats?.totalTasks ?? 0);
  const completionRate = currentProjectStats
    ? currentProjectStats.completionRate
    : (serverStats?.completionRate ?? 0);
  const todoTasksCount = currentProjectStats
    ? currentProjectStats.todoCount
    : (serverStats?.todoTasks ?? 0);
  const inProgressTasksCount = currentProjectStats
    ? currentProjectStats.progressCount
    : (serverStats?.inProgressTasks ?? 0);
  const completedTasksCount = currentProjectStats
    ? currentProjectStats.doneCount
    : (serverStats?.completedTasks ?? 0);

  const upcomingDeadlines = serverStats?.upcomingDeadlines || [];
  const recentActivities = serverStats?.recentActivities || [];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!title.trim()) return;

    try {
      await createBoard({
        name: title.trim(),
        title: title.trim(),
        description: description.trim(),
      }).unwrap();
      showToast({
        type: 'PROJECT_CREATED',
        title: 'Project Created',
        message: `Project "${title.trim()}" created successfully`,
      });
      setTitle('');
      setDescription('');
      setIsNewProjectModalOpen(false);
      refetchStats();
      refetchBoards();
    } catch (err: any) {
      setCreateError(err.data?.message || 'Failed to create project');
    }
  };

  const isUserAdmin = fallbackBoards.some((b) => {
    const oId = typeof b.owner === 'object' && b.owner !== null ? (b.owner as any)._id : b.owner;
    return String(oId) === String(currentUser?._id);
  });

  const userName = currentUser?.name || 'User';
  const userInitial = userName[0]?.toUpperCase() || 'U';

  const isLoading = isStatsLoading && isBoardsLoading;

  return (
    <div className="min-h-full px-4 sm:px-8 py-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* ─── Header: Dynamic Project Title & + New Project ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink">
              {displayTitle}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isUserAdmin
                  ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40'
                  : 'bg-blue-600/20 text-blue-200 border border-blue-500/35'
              }`}
            >
              {isUserAdmin ? 'ADMIN' : 'MEMBER'}
            </span>
          </div>
          <p className="text-sm text-mute font-medium mt-1">
            {currentBoard?.description || 'Collaborative team workspace and project management.'}
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="btn btn-primary self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* ─── Row 1: 3 Metric Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Projects */}
        <div className="glass-card card-lift p-6 flex items-center justify-between shadow-sm border border-edge">
          <div>
            <div className="text-4xl font-extrabold text-ink tracking-tight">
              {isLoading ? (
                <div className="h-9 w-12 skeleton rounded" />
              ) : (
                activeProjectsCount
              )}
            </div>
            <div className="text-xs font-semibold text-mute mt-1">Active Projects</div>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="glass-card card-lift p-6 flex items-center justify-between shadow-sm border border-edge">
          <div>
            <div className="text-4xl font-extrabold text-ink tracking-tight">
              {isLoading ? (
                <div className="h-9 w-12 skeleton rounded" />
              ) : (
                totalTasksCount
              )}
            </div>
            <div className="text-xs font-semibold text-mute mt-1">Total Tasks</div>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--danger) 18%, transparent)',
              borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)',
              color: 'var(--danger)',
            }}
          >
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="glass-card card-lift p-6 flex items-center justify-between shadow-sm border border-edge">
          <div>
            <div className="text-4xl font-extrabold text-ink tracking-tight">
              {isLoading ? (
                <div className="h-9 w-14 skeleton rounded" />
              ) : (
                `${completionRate}%`
              )}
            </div>
            <div className="text-xs font-semibold text-mute mt-1">Completion Rate</div>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--warning) 18%, transparent)',
              borderColor: 'color-mix(in srgb, var(--warning) 40%, transparent)',
              color: 'var(--warning)',
            }}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Row 2: Status Breakdown Card ─── */}
      <div className="glass-panel p-4 sm:p-5 flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-semibold rounded-2xl border border-edge">
        {/* Pink dot: Tasks To Do */}
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-pink-500 shadow-sm" />
          <span className="text-ink font-bold">{todoTasksCount}</span>
          <span className="text-mute font-medium">Tasks To Do</span>
        </div>

        {/* Red dot: In Progress */}
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-ink font-bold">{inProgressTasksCount}</span>
          <span className="text-mute font-medium">In Progress</span>
        </div>

        {/* Orange dot: Completed */}
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
          <span className="text-ink font-bold">{completedTasksCount}</span>
          <span className="text-mute font-medium">Completed</span>
        </div>
      </div>

      {/* ─── Row 3: Upcoming Deadlines & Workspace Activity Feed ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Upcoming Deadlines */}
        <UpcomingDeadlines
          tasks={upcomingDeadlines}
          isLoading={isStatsLoading}
          selectedProjectId={selectedProjectId}
          selectedProjectName={currentBoard?.name || currentBoard?.title}
        />

        {/* Right Card: Workspace Activity Feed */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/10">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-6">
              <Activity className="w-5 h-5 text-rose-400" />
              <span>Workspace Activity Feed</span>
            </div>

            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="flex items-start gap-3.5">
                  <div className="avatar w-8 h-8 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-white leading-snug">
                      <span className="font-bold">{userName}</span> active in workspace
                    </p>
                    <p className="text-[11px] text-slate-300 font-medium mt-1">Ready for collaboration</p>
                  </div>
                </div>
              ) : (
                recentActivities.slice(0, 5).map((act: any) => (
                  <div key={act._id} className="flex items-start gap-3.5 pt-3 first:pt-0 border-t border-edge first:border-t-0">
                    <div className="avatar w-8 h-8 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      {act.user?.name ? act.user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-white leading-snug">
                        <span className="font-bold">{act.user?.name || 'User'}</span>{' '}
                        {act.message || act.action || 'performed an activity'}
                        {act.board?.name && (
                          <span className="text-slate-300"> in "{act.board.name}"</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-300 font-medium mt-1">
                        {new Date(act.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 4: All Project Details Section ─── */}
      <div className="space-y-5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-400" />
              <span>All Project Details</span>
            </h2>
            <p className="text-xs font-medium text-slate-200 mt-0.5">
              Comprehensive overview of active Kanban projects in your workspace
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg glass-panel text-white border border-white/15">
              {projectsList.length} {projectsList.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
        </div>

        {projectsList.length === 0 ? (
          <div className="glass-card p-10 text-center space-y-4 border border-white/10">
            <div className="brand-mark w-14 h-14 mx-auto flex items-center justify-center">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Projects Found</h3>
              <p className="text-xs font-medium text-slate-200 max-w-sm mx-auto mt-1">
                You haven't created any Kanban projects yet. Start by creating your first project now!
              </p>
            </div>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projectsList.map((project: any) => {
              const pTitle = project.name || project.title || 'Untitled Project';
              const pDesc = project.description || 'No description provided for this project.';
              const pTasksCount = project.tasksCount ?? 0;
              const pDoneCount = project.doneCount ?? 0;
              const pProgressCount = project.progressCount ?? 0;
              const pTodoCount = project.todoCount ?? 0;
              const pRate = project.completionRate ?? 0;
              const membersCount = (project.members?.length || 0) + 1;

              return (
                <div
                  key={project._id}
                  className="glass-card card-lift p-5 flex flex-col justify-between transition-all group relative overflow-hidden border border-white/10"
                >
                  <div className="space-y-4">
                    {/* Project Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {pTitle}
                        </h3>
                        <p className="text-xs font-medium text-slate-200 line-clamp-2 mt-1 leading-relaxed">
                          {pDesc}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-emerald-300 border border-[color-mix(in_srgb,var(--success)_35%,transparent)] text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                        <span className="text-[10px] font-semibold text-slate-300">
                          {pTasksCount} {pTasksCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium">Progress</span>
                        <span className="font-bold text-white">{pRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-edge">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(pRate, 4)}%`,
                            background: 'var(--grad-accent, var(--accent))',
                          }}
                        />
                      </div>
                    </div>

                    {/* Tasks Breakdown Pills */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2 rounded-xl bg-surface/80 border border-white/10">
                        <span className="block font-bold text-pink-400">{pTodoCount}</span>
                        <span className="text-[10px] font-semibold text-slate-200">To Do</span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface/80 border border-white/10">
                        <span className="block font-bold text-rose-400">{pProgressCount}</span>
                        <span className="text-[10px] font-semibold text-slate-200">In Progress</span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface/80 border border-white/10">
                        <span className="block font-bold text-amber-400">{pDoneCount}</span>
                        <span className="text-[10px] font-semibold text-slate-200">Done</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Footer Actions */}
                  <div className="pt-4 mt-4 border-t border-edge flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
                      <Users className="w-3.5 h-3.5 text-purple-300" />
                      <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
                    </div>

                    <Link
                      to={`/boards/${project._id}`}
                      className="inline-flex items-center gap-1.5 font-bold text-purple-300 hover:text-white hover:underline transition-all group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Open Board</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal: Create New Project ─── */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="modal-scrim">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md modal-panel p-6 relative shadow-2xl"
            >
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="icon-btn absolute top-4 right-4"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">Create New Project</h3>
              <p className="text-xs text-slate-200 font-medium mb-6">
                Start a real-time Kanban project in TaskTrace
              </p>

              {createError && (
                <div className="notice notice-danger mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="label">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q4 Growth Sprint"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of board goals and scope..."
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn btn-primary"
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

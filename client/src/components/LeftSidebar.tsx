import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGetBoardsQuery, useCreateBoardMutation } from '../api/boardApi';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setMobileMenuOpen } from '../features/board/boardSlice';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils/toast';

export const LeftSidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const selectedProjectId = useAppSelector((state) => state.board.selectedProjectId);
  const isMobileMenuOpen = useAppSelector((state) => state.board.isMobileMenuOpen);
  const user = useAppSelector((state) => state.auth.user);
  const { data: boardsData } = useGetBoardsQuery();
  const [createBoard, { isLoading: isCreating }] = useCreateBoardMutation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tasktrace_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      return false;
    }
    return false;
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const boards = boardsData?.data || [];
  const currentBoard = boards.find((b) => b._id === selectedProjectId) || (boards.length > 0 ? boards[0] : null);
  const currentProjectName = currentBoard?.name || currentBoard?.title || (boards.length > 0 ? (boards[0].name || boards[0].title) : 'Workspace');

  const isUserAdmin = boards.some((b) => {
    const oId = typeof b.owner === 'object' && b.owner !== null ? (b.owner as any)._id : b.owner;
    return String(oId) === String(user?._id);
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tasktrace_sidebar_collapsed', String(next));
      } catch (e) {
        // ignore storage error
      }
      return next;
    });
  };

  useEffect(() => {
    dispatch(setMobileMenuOpen(false));
  }, [location.pathname, dispatch]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createBoard({ name: title.trim(), title: title.trim(), description: description.trim() }).unwrap();
      showToast({
        type: 'PROJECT_CREATED',
        title: 'Project Created',
        message: `Project "${title.trim()}" created successfully`,
      });
      setTitle('');
      setDescription('');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create board', err);
    }
  };

  const isDashboardActive = location.pathname === '/dashboard' || location.pathname === '/';
  const isSettingsActive = location.pathname.includes('/settings');
  const isProjectsActive = (location.pathname.startsWith('/boards') || location.pathname.startsWith('/projects')) && !isSettingsActive;
  const isTeamActive = location.pathname.startsWith('/team') || location.pathname.startsWith('/members');

  return (
    <>
      {/* ── Desktop Inline Sidebar ── */}
      <aside
        className={`hidden md:flex glass-panel border-r border-edge border-t-0 border-b-0 border-l-0 text-ink min-h-[calc(100vh-4rem)] transition-all duration-300 flex-col z-30 select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Dynamic Project / Workspace Header Card */}
        <div className="p-3 border-b border-edge">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              {/* Expand Sidebar Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-10 h-10 rounded-xl bg-surface hover:bg-white/10 border border-edge text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs hover:border-purple-400 group"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Create Board Button */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-surface hover:bg-white/10 border border-edge text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs hover:border-purple-400 group"
                title="Create New Project"
                aria-label="Create New Project"
              >
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-3.5 border border-edge shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                  CURRENT PROJECT
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-6 h-6 rounded-md hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Create New Project"
                    aria-label="Create New Project"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="w-6 h-6 rounded-md hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold text-ink tracking-tight leading-snug truncate" title={currentProjectName}>
                  {currentProjectName}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs font-semibold ${isUserAdmin ? 'text-purple-400' : 'text-blue-500'}`}>
                  Role: {isUserAdmin ? 'admin' : 'member'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 p-3 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {/* 1. Dashboard Link */}
          <Link
            to="/dashboard"
            className={`transition-all group flex items-center ${
              isCollapsed
                ? 'w-10 h-10 justify-center rounded-xl'
                : 'w-full gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm'
            } ${
              isDashboardActive
                ? 'sidebar-nav-active font-bold shadow-sm'
                : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] border border-transparent font-medium'
            }`}
            title="Dashboard"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <LayoutDashboard className={`w-4 h-4 ${isDashboardActive ? 'text-inherit' : 'text-mute group-hover:text-ink'}`} />
            </div>
            {!isCollapsed && <span className="truncate">Dashboard</span>}
          </Link>

          {/* 2. Projects & Tasks Link */}
          <Link
            to="/boards"
            className={`transition-all group flex items-center ${
              isCollapsed
                ? 'w-10 h-10 justify-center rounded-xl'
                : 'w-full gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm'
            } ${
              isProjectsActive && !isDashboardActive
                ? 'sidebar-nav-active font-bold shadow-sm'
                : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] border border-transparent font-medium'
            }`}
            title="Projects & Tasks"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <FolderKanban className={`w-4 h-4 ${isProjectsActive && !isDashboardActive ? 'text-inherit' : 'text-mute group-hover:text-ink'}`} />
            </div>
            {!isCollapsed && <span className="truncate">Projects & Tasks</span>}
          </Link>

          {/* 3. Team Members Link */}
          <Link
            to="/team"
            className={`transition-all group flex items-center ${
              isCollapsed
                ? 'w-10 h-10 justify-center rounded-xl'
                : 'w-full gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm'
            } ${
              isTeamActive
                ? 'sidebar-nav-active font-bold shadow-sm'
                : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] border border-transparent font-medium'
            }`}
            title="Team Members"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Users className={`w-4 h-4 ${isTeamActive ? 'text-inherit' : 'text-mute group-hover:text-ink'}`} />
            </div>
            {!isCollapsed && <span className="truncate">Team Members</span>}
          </Link>
        </nav>

        {/* Sidebar Footer with Settings & collapse/expand button */}
        <div className="p-3 border-t border-edge flex flex-col gap-1.5">
          {/* Settings Nav Item */}
          <Link
            to={currentBoard ? `/boards/${currentBoard._id}/settings` : '/settings'}
            className={`transition-all group flex items-center ${
              isCollapsed
                ? 'w-10 h-10 justify-center rounded-xl mx-auto'
                : 'w-full gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm'
            } ${
              isSettingsActive
                ? 'sidebar-nav-active font-bold shadow-sm'
                : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] border border-transparent font-medium'
            }`}
            title="Settings"
            aria-label="Settings"
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Settings className={`w-4 h-4 ${isSettingsActive ? 'text-inherit' : 'text-mute group-hover:text-ink transition-transform group-hover:rotate-45'}`} />
            </div>
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Link>

          {/* Collapse/Expand Toggle */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-edge mx-auto"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse sidebar</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile Off-Canvas Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-72 max-w-[85vw] h-full bg-card/95 backdrop-blur-2xl border-r border-edge flex flex-col p-4 shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-edge">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase block">
                    CURRENT PROJECT
                  </span>
                  <h3 className="text-base font-bold text-ink truncate mt-0.5" title={currentProjectName}>
                    {currentProjectName}
                  </h3>
                  <span className={`text-xs font-semibold ${isUserAdmin ? 'text-purple-400' : 'text-blue-500'}`}>
                    Role: {isUserAdmin ? 'admin' : 'member'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className="icon-btn w-8 h-8 shrink-0"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 space-y-1.5 overflow-y-auto py-2">
                <Link
                  to="/dashboard"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDashboardActive
                      ? 'sidebar-nav-active font-bold shadow-sm'
                      : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/boards"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isProjectsActive && !isDashboardActive
                      ? 'sidebar-nav-active font-bold shadow-sm'
                      : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)]'
                  }`}
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  <span>Projects & Tasks</span>
                </Link>

                <Link
                  to="/team"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isTeamActive
                      ? 'sidebar-nav-active font-bold shadow-sm'
                      : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)]'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Team Members</span>
                </Link>

                <Link
                  to={currentBoard ? `/boards/${currentBoard._id}/settings` : '/settings'}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSettingsActive
                      ? 'sidebar-nav-active font-bold shadow-sm'
                      : 'text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)]'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </Link>
              </nav>

              {/* Create Board CTA */}
              <div className="pt-3 border-t border-edge">
                <button
                  type="button"
                  onClick={() => {
                    dispatch(setMobileMenuOpen(false));
                    setIsCreateModalOpen(true);
                  }}
                  className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Project</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Navigation Bar (Thumb Friendly) ── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-edge flex items-center justify-around h-15 px-2 select-none shadow-lg"
      >
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            isDashboardActive ? 'text-accent font-bold scale-105' : 'text-mute hover:text-ink font-medium'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">Dashboard</span>
        </Link>

        <Link
          to="/boards"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            isProjectsActive && !isDashboardActive ? 'text-accent font-bold scale-105' : 'text-mute hover:text-ink font-medium'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span className="text-[10px]">Projects</span>
        </Link>

        {/* Quick Create Action */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-on-accent shadow-md -mt-3 border-2 border-surface active:scale-95 transition-transform"
          title="Create New Project"
          aria-label="Create New Project"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <Link
          to="/team"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            isTeamActive ? 'text-accent font-bold scale-105' : 'text-mute hover:text-ink font-medium'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Team</span>
        </Link>

        <Link
          to={currentBoard ? `/boards/${currentBoard._id}/settings` : '/settings'}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            isSettingsActive ? 'text-accent font-bold scale-105' : 'text-mute hover:text-ink font-medium'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px]">Settings</span>
        </Link>
      </nav>

      {/* Create New Project Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="modal-scrim">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md modal-panel p-6 relative"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="icon-btn absolute top-4 right-4"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-ink mb-1">Create New Project</h3>
              <p className="text-xs text-mute mb-6">
                Add a new collaborative Kanban project to your workspace
              </p>

              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div>
                  <label className="label">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mobile App Redesign"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of project goals and scope..."
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
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
    </>
  );
};
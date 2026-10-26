import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { setSelectedProjectId, toggleMobileMenu } from '../features/board/boardSlice';
import { useGetBoardsQuery } from '../api/boardApi';
import {
  Kanban,
  LogOut,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Menu,
} from 'lucide-react';
import ThemeSwitcher from '../theme/ThemeSwitcher';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const selectedProjectId = useAppSelector((state) => state.board.selectedProjectId);
  const { data: boardsData } = useGetBoardsQuery();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const boards = boardsData?.data || [];
  const currentBoard = boards.find((b) => b._id === selectedProjectId) || (boards.length > 0 ? boards[0] : null);
  const currentProjectName = currentBoard?.name || currentBoard?.title || (boards.length > 0 ? (boards[0].name || boards[0].title) : 'Workspace');

  const isUserAdmin = boards.some((b) => {
    const oId = typeof b.owner === 'object' && b.owner !== null ? (b.owner as any)._id : b.owner;
    return String(oId) === String(user?._id);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSelectProject = (boardId: string | null) => {
    dispatch(setSelectedProjectId(boardId));
    setIsDropdownOpen(false);
  };

  return (
    <nav className="h-16 glass-panel border-x-0 border-t-0 border-b border-edge sticky top-0 z-40 px-2.5 sm:px-6 flex items-center justify-between text-ink select-none">
      {/* Left: Hamburger (mobile) + Brand + Dynamic Project Selector */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => dispatch(toggleMobileMenu())}
            className="icon-btn flex h-9 w-9 md:!hidden shrink-0"
            aria-label="Toggle navigation drawer"
            title="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/dashboard" className="flex items-center space-x-2 group shrink-0">
          <div className="brand-mark w-8 h-8 sm:w-9 sm:h-9">
            <Kanban className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tight text-ink hidden xs:inline sm:inline">
            TaskTrace
          </span>
        </Link>

        {isAuthenticated && (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2">
              {/* Project Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-xl border border-edge bg-surface/50 hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] text-xs font-semibold text-ink transition-colors cursor-pointer"
                title="Select Project"
              >
                <Building2 className="w-3.5 h-3.5 text-mute shrink-0" />
                <span className="max-w-[75px] xs:max-w-[110px] sm:max-w-[140px] truncate">{currentProjectName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-mute shrink-0" />
              </button>

              {/* Role Badge - hidden on tiny mobile screens */}
              {isUserAdmin ? (
                <div className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-purple-600/25 text-purple-200 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider">
                  ADMIN
                </div>
              ) : (
                <div className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-200 border border-blue-500/35 text-[10px] font-bold uppercase tracking-wider">
                  MEMBER
                </div>
              )}
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="glass-panel absolute left-0 top-11 z-50 w-56 sm:w-60 rounded-2xl p-1.5 shadow-2xl border border-white/10 bg-card">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 border-b border-edge">
                  Your Projects ({boards.length})
                </div>

                <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelectProject(null)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      !selectedProjectId
                        ? 'bg-purple-600/30 text-white font-semibold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">All Projects Overview</span>
                    {!selectedProjectId && <Check className="w-3.5 h-3.5 text-purple-300" />}
                  </button>

                  {boards.map((b) => {
                    const isSelected = selectedProjectId === b._id;
                    const bName = b.name || b.title || 'Untitled';
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => handleSelectProject(b._id)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                          isSelected
                            ? 'bg-purple-600/30 text-white font-semibold'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate">{bName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-300" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 mt-1 border-t border-edge">
                  <Link
                    to="/boards"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage All Projects</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Dynamic Theme Switcher */}
        <ThemeSwitcher />

        {isAuthenticated && user ? (
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 ml-0.5 sm:ml-2">
            {/* User Profile Chip */}
            <div className="flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full glass-panel border border-edge">
              <div className="avatar w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs font-bold text-white bg-accent shadow-sm flex items-center justify-center rounded-full shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ink max-w-[100px] truncate hidden md:inline">
                {user.name}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="icon-btn text-danger hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] hover:text-danger w-8 h-8 sm:w-9 sm:h-9"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Link to="/login" className="btn btn-ghost px-2.5 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary px-3 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
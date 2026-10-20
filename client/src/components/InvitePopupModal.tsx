import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useJoinWorkspaceMutation,
  useGetBoardsQuery,
  useGetDashboardStatsQuery,
} from '../api/boardApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSelectedProjectId } from '../features/board/boardSlice';
import {
  Sparkles,
  CheckCircle2,
  X,
  Users,
  FolderKanban,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InvitePopupModal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: boardsData, refetch: refetchBoards } = useGetBoardsQuery(undefined, { skip: !isAuthenticated });
  const { refetch: refetchStats } = useGetDashboardStatsQuery(undefined, { skip: !isAuthenticated });
  const [joinWorkspace, { isLoading: isJoining }] = useJoinWorkspaceMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Extract invite info from URL or sessionStorage
  useEffect(() => {
    if (!isAuthenticated) return;

    const params = new URLSearchParams(location.search);
    const workspaceParam = params.get('workspace') || params.get('inviteWorkspace');
    const codeParam = params.get('inviteCode');
    const storedInvite = sessionStorage.getItem('tasktrace_pending_invite');

    let targetWorkspace = workspaceParam || '';
    let targetCode = codeParam || '';

    if (!targetWorkspace && !targetCode && storedInvite) {
      try {
        const parsed = JSON.parse(storedInvite);
        targetWorkspace = parsed.workspace || '';
        targetCode = parsed.inviteCode || '';
        sessionStorage.removeItem('tasktrace_pending_invite');
      } catch {
        sessionStorage.removeItem('tasktrace_pending_invite');
      }
    }

    if (targetWorkspace || targetCode) {
      // Check if user is already a member of this workspace to avoid redundant popups
      const boards = boardsData?.data || [];
      const alreadyMember = boards.some(
        (b) =>
          (targetWorkspace && (b.name?.toLowerCase() === targetWorkspace.toLowerCase() || b.title?.toLowerCase() === targetWorkspace.toLowerCase())) ||
          (targetCode && b.inviteCode === targetCode)
      );

      if (!alreadyMember) {
        setInviteName(targetWorkspace);
        setInviteCode(targetCode);
        setIsOpen(true);
      } else {
        // Clean up URL if already a member
        const cleanParams = new URLSearchParams(location.search);
        cleanParams.delete('workspace');
        cleanParams.delete('inviteWorkspace');
        cleanParams.delete('inviteCode');
        const searchStr = cleanParams.toString();
        navigate(`${location.pathname}${searchStr ? `?${searchStr}` : ''}`, { replace: true });
      }
    }
  }, [location.search, location.pathname, isAuthenticated, boardsData, navigate]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.removeItem('tasktrace_pending_invite');
    const cleanParams = new URLSearchParams(location.search);
    cleanParams.delete('workspace');
    cleanParams.delete('inviteWorkspace');
    cleanParams.delete('inviteCode');
    const searchStr = cleanParams.toString();
    navigate(`${location.pathname}${searchStr ? `?${searchStr}` : ''}`, { replace: true });
  };

  const handleAccept = async () => {
    setErrorMsg('');
    try {
      const res = await joinWorkspace({
        workspaceName: inviteName || undefined,
        inviteCode: inviteCode || undefined,
      }).unwrap();

      setSuccessMsg('Successfully joined the workspace!');
      dispatch(setSelectedProjectId(res.data.boardId));
      refetchBoards();
      refetchStats();

      setTimeout(() => {
        handleClose();
        navigate(`/boards/${res.data.boardId}`);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.data?.message || 'Failed to join workspace. It may not exist.');
    }
  };

  if (!isOpen || !isAuthenticated) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md modal-panel p-6 sm:p-8 relative text-ink shadow-2xl rounded-3xl border border-edge bg-card"
        >
          <button
            onClick={handleClose}
            className="icon-btn absolute top-4 right-4"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Invitation Badge & Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 border shadow-lg"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent), color-mix(in srgb, var(--accent-2) 15%, transparent))',
                borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
                color: 'var(--accent)',
              }}
            >
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3 h-3" />
              <span>Workspace Invitation</span>
            </div>

            <h2 className="text-2xl font-black text-ink tracking-tight mt-1">
              Join {inviteName ? `"${inviteName}"` : 'Workspace'}
            </h2>
            <p className="text-xs text-mute mt-2 max-w-xs leading-relaxed">
              You have been invited to collaborate in this workspace. Accept below to access Kanban boards, tasks, and real-time team updates.
            </p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="notice notice-danger mb-4 text-xs text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="notice notice-success mb-4 text-xs text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Workspace preview card */}
          <div className="glass-card p-4 rounded-2xl mb-6 flex items-center justify-between border border-edge">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <FolderKanban className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-ink block truncate max-w-[180px]">
                  {inviteName || 'Project Workspace'}
                </span>
                <span className="text-[10px] text-mute block">TaskTrace Collaborative Board</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-mute">
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>Collaborator</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost flex-1 py-3 text-xs"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={isJoining || Boolean(successMsg)}
              className="btn btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isJoining ? (
                <span>Joining...</span>
              ) : (
                <>
                  <span>Accept & Join</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

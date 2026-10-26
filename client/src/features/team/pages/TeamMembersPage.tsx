import React, { useState, useMemo, useEffect } from 'react';
import {
  useGetBoardsQuery,
  useGetWorkspaceMembersQuery,
  useInviteMemberMutation,
  useGetBoardInviteCodeQuery,
} from '../../../api/boardApi';
import { useAppSelector } from '../../../app/hooks';
import { getSocket } from '../../../sockets/socket';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Copy,
  Check,
  Search,
  FolderKanban,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeamMembersPage: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const selectedProjectId = useAppSelector((state) => state.board.selectedProjectId);

  const {
    data: membersData,
    isLoading: isLoadingMembers,
    isFetching: isFetchingMembers,
    refetch: refetchMembers,
  } = useGetWorkspaceMembersQuery();

  const {
    data: boardsData,
    isLoading: isLoadingBoards,
    refetch: refetchBoards,
  } = useGetBoardsQuery();

  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedInviteBoardId, setSelectedInviteBoardId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const boards = boardsData?.data || [];
  const activeBoard = boards.find((b) => b._id === selectedProjectId) || (boards.length > 0 ? boards[0] : null);
  const workspaceName = activeBoard?.name || activeBoard?.title || 'Workspace';

  const primaryBoardId = selectedInviteBoardId || (boards.length > 0 ? boards[0]._id : '');
  const { data: inviteCodeData } = useGetBoardInviteCodeQuery(primaryBoardId, {
    skip: !primaryBoardId,
  });

  const inviteCode = inviteCodeData?.data?.inviteCode || activeBoard?.inviteCode || '';
  const shareableJoinUrl = inviteCode
    ? `${window.location.origin}/boards/join/${inviteCode}`
    : `${window.location.origin}/join?workspace=${encodeURIComponent(workspaceName)}`;

  // Real-time socket listener for member additions
  useEffect(() => {
    const socket = getSocket();
    const handleMemberUpdate = () => {
      refetchMembers();
      refetchBoards();
    };

    socket.on('board:member-added', handleMemberUpdate);
    socket.on('workspace:member-added', handleMemberUpdate);
    socket.on('board:member-removed', handleMemberUpdate);

    return () => {
      socket.off('board:member-added', handleMemberUpdate);
      socket.off('workspace:member-added', handleMemberUpdate);
      socket.off('board:member-removed', handleMemberUpdate);
    };
  }, [refetchMembers, refetchBoards]);

  // Consolidate unique members across all boards
  const memberList = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role: 'Admin' | 'Member';
        boards: string[];
        boardIds: string[];
      }
    >();

    // 1. Populate from backend workspace members endpoint if available
    if (membersData?.data && Array.isArray(membersData.data)) {
      membersData.data.forEach((m) => {
        if (!m || !m._id) return;
        map.set(m._id, {
          id: m._id,
          name: m.name || 'Team Member',
          email: m.email || '',
          avatar: m.avatar,
          role: m.role || 'Member',
          boards: m.boards || [],
          boardIds: m.boardIds || [],
        });
      });
    }

    // 2. Fallback / Merge from boards list (ensuring both owner and members are handled)
    boards.forEach((board) => {
      const bTitle = board.name || board.title || 'Project';
      const bId = String(board._id);

      // Handle Board Owner
      if (board.owner) {
        const ownerObj: any = board.owner;
        const ownerId = String(ownerObj._id || ownerObj);
        if (map.has(ownerId)) {
          const existing = map.get(ownerId)!;
          existing.role = 'Admin';
          if (!existing.boards.includes(bTitle)) existing.boards.push(bTitle);
          if (!existing.boardIds.includes(bId)) existing.boardIds.push(bId);
        } else {
          map.set(ownerId, {
            id: ownerId,
            name: ownerObj.name || (currentUser?._id === ownerId ? currentUser.name : 'Workspace Owner'),
            email: ownerObj.email || (currentUser?._id === ownerId ? currentUser.email : ''),
            avatar: ownerObj.avatar,
            role: 'Admin',
            boards: [bTitle],
            boardIds: [bId],
          });
        }
      }

      // Handle Board Members (both populated objects and id strings)
      if (board.members && Array.isArray(board.members)) {
        board.members.forEach((m: any) => {
          if (!m) return;
          const isPopulated = typeof m === 'object' && m !== null;
          const memberId = String(isPopulated ? m._id || m.id : m);

          const isOwnerOfAny = boards.some((b) => {
            const oId = String((b.owner as any)?._id || b.owner);
            return oId === memberId;
          });

          if (map.has(memberId)) {
            const existing = map.get(memberId)!;
            if (isOwnerOfAny) existing.role = 'Admin';
            if (!existing.boards.includes(bTitle)) existing.boards.push(bTitle);
            if (!existing.boardIds.includes(bId)) existing.boardIds.push(bId);
          } else {
            map.set(memberId, {
              id: memberId,
              name: isPopulated ? m.name || 'Team Member' : (currentUser?._id === memberId ? currentUser.name : 'Team Member'),
              email: isPopulated ? m.email || '' : (currentUser?._id === memberId ? currentUser.email : ''),
              avatar: isPopulated ? m.avatar : undefined,
              role: isOwnerOfAny ? 'Admin' : 'Member',
              boards: [bTitle],
              boardIds: [bId],
            });
          }
        });
      }
    });

    // 3. Ensure current user is in map if logged in
    if (currentUser && currentUser._id && !map.has(currentUser._id)) {
      const isOwnerOfAny = boards.some((b) => {
        const oId = String((b.owner as any)?._id || b.owner);
        return oId === currentUser._id;
      });

      map.set(currentUser._id, {
        id: currentUser._id,
        name: currentUser.name || 'You',
        email: currentUser.email || '',
        avatar: currentUser.avatar,
        role: isOwnerOfAny ? 'Admin' : 'Member',
        boards: ['All Projects'],
        boardIds: boards.map((b) => b._id),
      });
    }

    return Array.from(map.values());
  }, [membersData, boards, currentUser]);

  const filteredMembers = useMemo(() => {
    return memberList.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'admin' && m.role.toLowerCase() === 'admin') ||
        (roleFilter === 'member' && m.role.toLowerCase() === 'member');

      const matchesProject =
        projectFilter === 'all' ||
        m.boards.includes('All Projects') ||
        m.boardIds.includes(projectFilter);

      return matchesSearch && matchesRole && matchesProject;
    });
  }, [memberList, searchQuery, roleFilter, projectFilter]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleManualRefresh = () => {
    refetchMembers();
    refetchBoards();
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteEmail.trim()) return;

    if (!primaryBoardId) {
      setInviteError('Please create at least one project before sending invitations.');
      return;
    }

    try {
      await inviteMember({ boardId: primaryBoardId, email: inviteEmail.trim() }).unwrap();
      setInviteSuccess(`Invitation successfully sent to ${inviteEmail}!`);
      setInviteEmail('');
      refetchMembers();
      refetchBoards();
      setTimeout(() => setInviteSuccess(''), 4000);
    } catch (err: any) {
      setInviteError(err?.data?.message || 'Failed to send invitation. Please try again.');
    }
  };

  const adminCount = memberList.filter((m) => m.role.toLowerCase() === 'admin').length;
  const standardCount = memberList.filter((m) => m.role.toLowerCase() === 'member').length;
  const isRefreshing = isFetchingMembers;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-edge">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-accent shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Team Members
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent border border-[color-mix(in_srgb,var(--accent)_28%,transparent)]">
              {workspaceName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-mute">
            Manage collaborators, assign project roles, and invite teammates to your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost border border-edge text-xs flex items-center justify-center space-x-1.5 cursor-pointer py-2 px-2.5 sm:px-3"
            title="Refresh members list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-ghost border border-edge text-xs flex-1 sm:flex-none justify-center flex items-center space-x-1.5 sm:space-x-2 cursor-pointer py-2 px-2.5 sm:px-3"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" />
                <span className="text-accent font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>

          {/* Invite Member Button */}
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary text-xs flex-1 sm:flex-none justify-center flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shadow-sm py-2 px-3 sm:px-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 rounded-2xl border border-edge">
          <div className="text-mute text-xs font-medium uppercase tracking-wider mb-1">
            Total Members
          </div>
          <div className="text-2xl font-black text-ink">{memberList.length}</div>
          <div className="text-[11px] text-mute mt-1">Across all projects</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-edge">
          <div className="text-mute text-xs font-medium uppercase tracking-wider mb-1">
            Admins
          </div>
          <div className="text-2xl font-black text-accent">{adminCount}</div>
          <div className="text-[11px] text-mute mt-1">Full workspace control</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-edge">
          <div className="text-mute text-xs font-medium uppercase tracking-wider mb-1">
            Collaborators
          </div>
          <div className="text-2xl font-black text-ink">{standardCount}</div>
          <div className="text-[11px] text-mute mt-1">Team contributors</div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-edge">
          <div className="text-mute text-xs font-medium uppercase tracking-wider mb-1">
            Active Projects
          </div>
          <div className="text-2xl font-black text-ink">{boards.length}</div>
          <div className="text-[11px] text-mute mt-1">Collaborative boards</div>
        </div>
      </div>

      {/* Instant Join Link Card */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-edge flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-surface border border-edge flex items-center justify-center text-accent shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Quick Invite Link</h3>
            <p className="text-xs text-mute mt-0.5">
              Share this invite link with anyone to give them immediate access to join this workspace.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto flex items-center space-x-2">
          <div className="flex-1 md:w-80 input font-mono text-xs truncate bg-surface/60 border border-edge select-all py-2">
            {shareableJoinUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-primary text-xs shrink-0 cursor-pointer"
          >
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9 text-xs sm:text-sm py-2"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="input text-xs py-2 flex-1 sm:w-32 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
          </select>

          {boards.length > 1 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input text-xs py-2 flex-1 sm:w-40 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {boards.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name || b.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Members List Cards */}
      <div className="space-y-3">
        {isLoadingBoards || isLoadingMembers ? (
          <div className="glass-card p-12 text-center rounded-2xl border border-edge">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-mute">Loading workspace members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl border border-edge">
            <Users className="w-10 h-10 text-mute mx-auto mb-3 opacity-40" />
            <h4 className="text-sm font-bold text-ink mb-1">No Members Found</h4>
            <p className="text-xs text-mute max-w-xs mx-auto">
              No team members match your current filter criteria or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="glass-card p-4 rounded-2xl border border-edge hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-accent border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {member.name ? member.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-ink truncate" title={member.name}>
                          {member.name}
                        </span>
                        {member.id === currentUser?._id && (
                          <span className="text-[10px] text-faint bg-surface px-1.5 py-0.2 rounded border border-edge font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-mute block truncate" title={member.email}>
                        {member.email}
                      </span>
                    </div>
                  </div>

                  {member.role === 'Admin' ? (
                    <span className="text-[10px] font-bold bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent px-2 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center space-x-1 shrink-0">
                      <Shield className="w-3 h-3" />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium bg-surface text-mute px-2 py-0.5 rounded-full border border-edge flex items-center space-x-1 shrink-0">
                      <Users className="w-3 h-3" />
                      <span>Collaborator</span>
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-edge flex items-center justify-between text-xs text-mute">
                  <div className="flex items-center space-x-1.5 truncate">
                    <FolderKanban className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-[11px] truncate">
                      {member.boards.slice(0, 2).join(', ')}
                      {member.boards.length > 2 && ` +${member.boards.length - 2}`}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-faint shrink-0">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="modal-scrim">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md modal-panel p-6 relative"
            >
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="icon-btn absolute top-4 right-4 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Invite Team Member</h3>
                  <p className="text-xs text-mute">Send an invite to collaborate on your projects</p>
                </div>
              </div>

              {inviteError && (
                <div className="notice notice-danger text-xs mb-4">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="notice notice-success text-xs mb-4 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="label">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="input pl-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {boards.length > 1 && (
                  <div>
                    <label className="label">Project / Board</label>
                    <select
                      value={primaryBoardId}
                      onChange={(e) => setSelectedInviteBoardId(e.target.value)}
                      className="input text-xs sm:text-sm cursor-pointer"
                    >
                      {boards.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name || b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-3 border-t border-edge">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="btn btn-ghost text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="btn btn-primary text-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isInviting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Send Invite</span>
                      </>
                    )}
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

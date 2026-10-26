import React, { useState } from 'react';
import type { Board, User, Invitation } from '../../../types';
import {
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useGetBoardInvitationsQuery,
  useGetBoardInviteCodeQuery,
  useRegenerateInviteCodeMutation,
} from '../../../api/boardApi';
import {
  X,
  Users,
  Mail,
  UserPlus,
  Shield,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmDeleteModal } from '../../../components/ConfirmDeleteModal';
import { showToast } from '../../../utils/toast';

interface BoardMembersModalProps {
  board: Board;
  currentUserId: string;
  onlineMemberIds: string[];
  onClose: () => void;
}

export const BoardMembersModal: React.FC<BoardMembersModalProps> = ({
  board,
  currentUserId,
  onlineMemberIds,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'share' | 'pending' | 'invite'>('members');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: invitationsData, isLoading: isInvitesLoading } = useGetBoardInvitationsQuery(board._id);
  const { data: inviteCodeData } = useGetBoardInviteCodeQuery(board._id);
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [regenerateInviteCode, { isLoading: isRegenerating }] = useRegenerateInviteCodeMutation();

  const isOwner = typeof board.owner === 'string' ? board.owner === currentUserId : board.owner._id === currentUserId;

  const members: User[] = board.members || [];
  const invitations: Invitation[] = invitationsData?.data || [];

  const inviteCode = inviteCodeData?.data?.inviteCode || board.inviteCode || '';
  const shareableUrl = `${window.location.origin}/boards/join/${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [memberToKick, setMemberToKick] = useState<{ id: string; name: string } | null>(null);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

  const handleRegenerateLink = () => {
    setIsRegenerateConfirmOpen(true);
  };

  const handleConfirmRegenerate = async () => {
    try {
      await regenerateInviteCode(board._id).unwrap();
      showToast({
        type: 'TASK_UPDATED',
        title: 'Link Regenerated',
        message: 'The previous share link has been revoked.',
      });
      setIsRegenerateConfirmOpen(false);
    } catch (err: any) {
      showToast({
        type: 'TASK_DELETED',
        title: 'Error',
        message: err.data?.message || 'Failed to regenerate share link',
      });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) return;

    try {
      await inviteMember({ boardId: board._id, email: email.trim() }).unwrap();
      setSuccessMsg(`Invitation request sent to ${email}!`);
      setEmail('');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('pending');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.data?.message || 'Failed to send invitation.');
    }
  };

  const handleConfirmKick = async () => {
    if (!memberToKick) return;
    try {
      await removeMember({ boardId: board._id, memberId: memberToKick.id }).unwrap();
      showToast({
        type: 'TASK_DELETED',
        title: 'Member Removed',
        message: `${memberToKick.name} was removed from the board.`,
      });
      setMemberToKick(null);
    } catch (err: any) {
      showToast({
        type: 'TASK_DELETED',
        title: 'Error',
        message: err.data?.message || 'Failed to remove member',
      });
    }
  };

  const ownerUser = typeof board.owner === 'object' ? (board.owner as User) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 sm:mb-6 pr-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Board Members & Access</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Share board link, manage collaborators, and kick members</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-4 gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length + 1})</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'share'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Invites ({invitations.filter((i) => i.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'invite'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Send Email Invite</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              {/* Owner Item */}
              {ownerUser && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500">
                        {ownerUser.name ? ownerUser.name[0].toUpperCase() : 'O'}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                          onlineMemberIds.includes(ownerUser._id) ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center space-x-2">
                        <span>{ownerUser.name}</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center space-x-1">
                          <Shield className="w-3 h-3" />
                          <span>Owner</span>
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">{ownerUser.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Board Owner</span>
                </div>
              )}

              {/* Members List with Kick Option */}
              {members.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No additional team members yet.</p>
              ) : (
                members.map((member) => {
                  const isOnline = onlineMemberIds.includes(member._id);
                  return (
                    <div key={member._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {member.name ? member.name[0].toUpperCase() : 'M'}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-400">Member</span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => setMemberToKick({ id: member._id, name: member.name })}
                            disabled={isRemoving}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                            title="Kick Member from Board"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Kick</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Share Link Tab */}
          {activeTab === 'share' && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-slate-300">
                Anyone with this link can join this board as a collaborator. Board owners receive instant notifications when members join.
              </p>

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Shareable Board Invite Link
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-indigo-300 font-mono truncate select-all">
                    {shareableUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isOwner && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Revoke / Regenerate Link</h4>
                    <p className="text-[11px] text-slate-400">Invalidates the current share link and generates a new one</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateLink}
                    disabled={isRegenerating}
                    className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/30 transition-colors flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate Link</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending Invitations Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {isInvitesLoading ? (
                <p className="text-xs text-slate-500">Loading invitations...</p>
              ) : invitations.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No invitation history for this board.</p>
              ) : (
                invitations.map((inv) => (
                  <div key={inv._id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{inv.inviteeEmail}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1 ${
                          inv.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : inv.status === 'accepted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {inv.status === 'pending' && <Clock className="w-3 h-3" />}
                        {inv.status === 'accepted' && <CheckCircle2 className="w-3 h-3" />}
                        {inv.status === 'declined' && <XCircle className="w-3 h-3" />}
                        <span>{inv.status}</span>
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Invited by {inv.inviter?.name || 'Admin'} on {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Send Invite Form Tab */}
          {activeTab === 'invite' && (
            <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
              <p className="text-xs text-slate-300">
                Send an invitation request to a user's email address. They will receive a notification to Accept or Decline.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Invitee Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {isInviting ? (
                    <span>Sending Request...</span>
                  ) : (
                    <>
                      <span>Send Invitation Request</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      <ConfirmDeleteModal
        isOpen={!!memberToKick}
        title="Remove Member?"
        itemName={memberToKick?.name}
        message={`Are you sure you want to remove "${memberToKick?.name}" from this board? They will lose access to all tasks and activity.`}
        confirmLabel="Remove Member"
        isLoading={isRemoving}
        onConfirm={handleConfirmKick}
        onCancel={() => setMemberToKick(null)}
      />

      <ConfirmDeleteModal
        isOpen={isRegenerateConfirmOpen}
        title="Regenerate Share Link?"
        message="Regenerating will immediately revoke the current share link. Anyone with the old link will no longer be able to join."
        confirmLabel="Regenerate Link"
        isLoading={isRegenerating}
        onConfirm={handleConfirmRegenerate}
        onCancel={() => setIsRegenerateConfirmOpen(false)}
      />
    </div>
  );
};
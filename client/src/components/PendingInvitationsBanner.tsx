import React from 'react';
import {
  useGetPendingInvitationsQuery,
  useRespondInvitationMutation,
} from '../api/boardApi';
import { Mail, Check, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils/toast';

export const PendingInvitationsBanner: React.FC = () => {
  const { data, isLoading } = useGetPendingInvitationsQuery();
  const [respondInvitation, { isLoading: isResponding }] = useRespondInvitationMutation();

  const invitations = data?.data || [];

  if (isLoading || invitations.length === 0) return null;

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      await respondInvitation({ invitationId, action }).unwrap();
      showToast({
        type: 'BOARD_INVITATION',
        title: action === 'accept' ? 'Invitation Accepted' : 'Invitation Declined',
        message: action === 'accept' ? 'You joined the board.' : 'Invitation declined.',
      });
    } catch (err: any) {
      showToast({
        type: 'GENERAL',
        title: 'Error',
        message: err.data?.message || 'Failed to respond to invitation',
      });
    }
  };

  return (
    <div
      className="glass-panel border-x-0 border-t-0 border-b px-3.5 sm:px-6 py-2 sm:py-2.5"
      style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 7%, var(--surface)), color-mix(in srgb, var(--accent-2) 5%, var(--surface)))' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center space-x-2.5 sm:space-x-3 text-xs sm:text-sm font-medium text-ink w-full sm:w-auto">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 24%, transparent)' }}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span>
            You have{' '}
            <strong style={{ color: 'var(--accent)' }}>{invitations.length}</strong> pending invitation(s)
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto max-w-full w-full sm:w-auto pb-1 sm:pb-0">
          <AnimatePresence>
            {invitations.map((inv) => (
              <motion.div
                key={inv._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center space-x-3 glass-card px-3.5 py-1.5 rounded-xl text-xs"
              >
                <div className="flex items-center space-x-1.5 text-ink">
                  <Mail className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span className="font-bold text-ink">{inv.board?.title || inv.board?.name || 'Board'}</span>
                  <span className="text-mute">from {inv.inviter?.name || 'Admin'}</span>
                </div>

                <div className="flex items-center space-x-1.5 ml-2">
                  <button
                    onClick={() => handleRespond(inv._id, 'accept')}
                    disabled={isResponding}
                    className="btn btn-primary px-2.5 py-1 text-[11px]"
                  >
                    <Check className="w-3 h-3" />
                    <span>Accept</span>
                  </button>

                  <button
                    onClick={() => handleRespond(inv._id, 'decline')}
                    disabled={isResponding}
                    className="btn btn-ghost btn-danger px-2.5 py-1 text-[11px]"
                  >
                    <X className="w-3 h-3" />
                    <span>Decline</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
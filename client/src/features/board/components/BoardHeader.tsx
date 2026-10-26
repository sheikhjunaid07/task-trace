import React from 'react';
import type { Board, User } from '../../../types';
import { UserPlus, BarChart2, Radio, Share2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleAnalyticsModal } from '../boardSlice';

interface BoardHeaderProps {
  board: Board;
  onlineMemberIds: string[];
  onOpenInviteModal: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  onlineMemberIds,
  onOpenInviteModal,
}) => {
  const dispatch = useAppDispatch();
  const { isAnalyticsOpen } = useAppSelector((state) => state.board);

  const members = board.members || [];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b divider mb-6">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-hero text-white font-extrabold">{board.name}</h1>
            <span className="badge badge-success font-semibold text-white">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Realtime</span>
            </span>
          </div>
          {board.description && (
            <p className="text-meta text-slate-200 font-medium mt-1.5 line-clamp-1">{board.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <div className="flex items-center -space-x-1.5 glass-panel rounded-full px-2.5 py-1.5 border border-white/10">
          {members.map((member: User | any) => {
            const mId = typeof member === 'string' ? member : member._id;
            const mName = typeof member === 'string' ? 'Member' : member.name;
            const isOnline = onlineMemberIds.includes(mId);

            return (
              <div
                key={mId}
                className="relative group"
                title={`${mName} (${isOnline ? 'Online' : 'Offline'})`}
              >
                <div
                  className="avatar w-7 h-7 text-xs font-bold text-white"
                  style={{ boxShadow: '0 0 0 2.5px var(--surface)' }}
                >
                  {mName ? mName[0].toUpperCase() : 'U'}
                </div>
                {isOnline && <span className="presence-dot absolute -bottom-0.5 -right-0.5" />}
              </div>
            );
          })}

          <button
            onClick={onOpenInviteModal}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors ml-2"
            style={{ boxShadow: '0 0 0 2.5px var(--surface)' }}
            title="Members & Share Link"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onOpenInviteModal}
          className="chip hover:border-white/30 transition-all font-semibold text-white"
          title="Share Board Invite Link"
        >
          <Share2 className="w-4 h-4 text-slate-300" />
          <span>Share</span>
        </button>

        <button
          onClick={() => dispatch(toggleAnalyticsModal())}
          className={isAnalyticsOpen ? 'chip chip-active font-semibold text-white' : 'chip font-semibold text-white'}
        >
          <BarChart2 className="w-4 h-4 text-slate-300" />
          <span>Analytics</span>
        </button>
      </div>
    </div>
  );
};
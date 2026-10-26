import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useGetBoardByIdQuery } from '../../../api/boardApi';
import { useGetBoardTasksQuery } from '../../../api/taskApi';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { setActiveTaskId } from '../boardSlice';
import { useSocketEvents } from '../../../sockets/useSocketEvents';
import { BoardHeader } from '../components/BoardHeader';
import { FilterBar } from '../components/FilterBar';
import { BoardMembersModal } from '../components/BoardMembersModal';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { KanbanBoard } from '../../kanban/components/KanbanBoard';
import { TaskModal } from '../../kanban/components/TaskModal';
import { KeyboardShortcutsModal } from '../../../components/KeyboardShortcutsModal';
import { ArrowLeft, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const { data: boardData, isLoading: isBoardLoading, error: boardError } = useGetBoardByIdQuery(boardId!);
  const { data: tasksData, isLoading: isTasksLoading } = useGetBoardTasksQuery(boardId!);

  const { searchQuery, priorityFilter, assigneeFilter, activeTaskId, isActivityOpen, isAnalyticsOpen } =
    useAppSelector((state) => state.board);

  useEffect(() => {
    const taskIdParam = searchParams.get('taskId');
    if (taskIdParam) {
      dispatch(setActiveTaskId(taskIdParam));
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (!activeTaskId && searchParams.has('taskId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('taskId');
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTaskId, searchParams, setSearchParams]);

  const currentUser = useAppSelector((state) => state.auth.user);
  const {
    connectionStatus,
    onlineMembers,
    typingUsersMap,
    draggingTasks,
    emitTypingStart,
    emitTypingStop,
    emitDragStart,
    emitDragEnd,
    refreshBoard,
  } = useSocketEvents(boardId);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  if (isBoardLoading || isTasksLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="h-12 skeleton" />
        <div className="h-10 skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 h-[600px]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (boardError || !boardData?.data) {
    return (
      <div className="max-w-md mx-auto my-16 text-center glass-card p-6 sm:p-8">
        <h2 className="text-card-title text-xl font-bold mb-2" style={{ color: 'var(--danger)' }}>
          Board Not Found
        </h2>
        <p className="text-body text-sm text-mute mb-6">
          Could not load this board. It may have been deleted or you don't have permission.
        </p>
        <Link to="/boards" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Boards</span>
        </Link>
      </div>
    );
  }

  const board = boardData.data;
  const rawTasks = tasksData?.data || [];

  const filteredTasks = rawTasks.filter((task) => {
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    const matchesAssignee =
      assigneeFilter === 'all' ||
      (task.assignees &&
        task.assignees.some((a) => (typeof a === 'string' ? a === assigneeFilter : a._id === assigneeFilter)));

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const activeTask = rawTasks.find((t) => t._id === activeTaskId);

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6 min-h-[calc(100vh-4rem)] flex flex-col relative">
      {/* Realtime Disconnect / Reconnecting Banner */}
      <AnimatePresence>
        {connectionStatus !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between shadow-lg backdrop-blur-md ${
              connectionStatus === 'reconnecting'
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                : 'bg-rose-950/40 border-rose-600/40 text-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2.5 text-xs font-medium">
              {connectionStatus === 'reconnecting' ? (
                <Wifi className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {connectionStatus === 'reconnecting'
                  ? 'Reconnecting to real-time synchronization...'
                  : 'Disconnected from live updates. Working in offline mode.'}
              </span>
            </div>
            <button
              onClick={refreshBoard}
              type="button"
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 transition-all text-white border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Board</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BoardHeader
        board={board}
        onlineMemberIds={onlineMembers}
        onOpenInviteModal={() => setIsMembersModalOpen(true)}
      />

      <FilterBar
        members={board.members || []}
        totalTasksCount={rawTasks.length}
        filteredTasksCount={filteredTasks.length}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      <KanbanBoard
        boardId={board._id}
        columns={board.columns || []}
        tasks={filteredTasks}
        typingUsersMap={typingUsersMap}
        draggingTasks={draggingTasks}
        onDragStart={emitDragStart}
        onDragEnd={emitDragEnd}
      />

      <AnimatePresence>
        {isMembersModalOpen && (
          <BoardMembersModal
            board={board}
            currentUserId={currentUser?._id || ''}
            onlineMemberIds={onlineMembers}
            onClose={() => setIsMembersModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTask && (
          <TaskModal
            task={activeTask}
            boardId={board._id}
            members={board.members || []}
            columns={board.columns || []}
            typingUsers={typingUsersMap ? typingUsersMap[activeTask._id] : undefined}
            onTypingStart={emitTypingStart}
            onTypingStop={emitTypingStop}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActivityOpen && <ActivityTimeline boardId={board._id} />}
      </AnimatePresence>

      <AnimatePresence>
        {isAnalyticsOpen && <AnalyticsPanel tasks={rawTasks} columns={board.columns || []} />}
      </AnimatePresence>

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
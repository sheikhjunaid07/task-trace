import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { connectSocket, getSocket } from './socket';
import { taskApi, isPendingOp } from '../api/taskApi';
import { boardApi } from '../api/boardApi';
import { commentApi } from '../api/commentApi';
import { activityApi } from '../api/activityApi';
import type { Task } from '../types';
import type { RootState } from '../app/store';
import { showToast } from '../utils/toast';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface DraggingUser {
  userId: string;
  userName: string;
}

export const useSocketEvents = (boardId: string | undefined) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state: RootState) => state.auth.token);
  const currentUserId = useAppSelector((state: RootState) => state.auth.user?._id);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  const [typingUsersMap, setTypingUsersMap] = useState<Record<string, TypingUser[]>>({});
  const [draggingTasks, setDraggingTasks] = useState<Record<string, DraggingUser>>({});

  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const hasConnectedOnceRef = useRef<boolean>(false);

  const refreshBoard = useCallback(() => {
    if (!boardId) return;
    dispatch(taskApi.util.invalidateTags([{ type: 'Task', id: `BOARD_${boardId}` }]));
    dispatch(boardApi.util.invalidateTags([{ type: 'Board', id: boardId }]));
    dispatch(activityApi.util.invalidateTags([{ type: 'Activity', id: boardId }]));
  }, [boardId, dispatch]);

  useEffect(() => {
    if (!boardId || !token) return;

    const socket = connectSocket(token);

    const onConnect = () => {
      setConnectionStatus('connected');
      socket.emit('board:join', boardId);

      // If reconnecting after a drop, auto-refresh the board state
      if (hasConnectedOnceRef.current) {
        refreshBoard();
      }
      hasConnectedOnceRef.current = true;
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const onConnectError = () => {
      setConnectionStatus('reconnecting');
    };

    // Socket lifecycle handlers
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', () => setConnectionStatus('reconnecting'));
    socket.io.on('reconnect', onConnect);

    if (socket.connected) {
      onConnect();
    }

    // Auto-refresh on window focus & network recovery
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible' && socket.connected) {
        refreshBoard();
      }
    };

    const handleOnline = () => {
      setConnectionStatus('reconnecting');
      if (!socket.connected) socket.connect();
      refreshBoard();
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    // 1. Task Created (with duplicate suppression for originator)
    const handleTaskCreated = (payload: {
      boardId: string;
      task: Task;
      actorId?: string;
      opId?: string;
    }) => {
      if (payload.boardId === boardId) {
        // Suppress duplicate if locally initiated
        if (payload.actorId === currentUserId && isPendingOp(payload.opId)) {
          return;
        }

        dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            if (!draft.data.some((t: Task) => t._id === payload.task._id)) {
              draft.data.push(payload.task);
              draft.data.sort((a: Task, b: Task) => a.position - b.position || a._id.localeCompare(b._id));
            }
          })
        );
        dispatch(activityApi.util.invalidateTags([{ type: 'Activity', id: boardId }]));

        if (payload.actorId && payload.actorId !== currentUserId) {
          showToast({
            type: 'TASK_CREATED',
            title: 'Task Added',
            message: `Task "${payload.task.title}" added to board`,
            boardId,
            taskId: payload.task._id,
          });
        }
      }
    };

    // 2. Task Moved (instant updates + duplicate suppression + deterministic sort)
    const handleTaskMoved = (payload: {
      boardId: string;
      taskId: string;
      columnId: string;
      position: number;
      task?: Task;
      actorId?: string;
      opId?: string;
    }) => {
      if (payload.boardId === boardId) {
        if (payload.actorId === currentUserId && isPendingOp(payload.opId)) {
          return;
        }

        dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            const task = draft.data.find((t: Task) => t._id === payload.taskId);
            if (task) {
              task.columnId = payload.columnId;
              task.position = payload.position;
              if (payload.task?.version) task.version = payload.task.version;
              draft.data.sort((a: Task, b: Task) => a.position - b.position || a._id.localeCompare(b._id));
            } else if (payload.task) {
              draft.data.push(payload.task);
              draft.data.sort((a: Task, b: Task) => a.position - b.position || a._id.localeCompare(b._id));
            }
          })
        );

        if (payload.actorId && payload.actorId !== currentUserId) {
          showToast({
            type: 'TASK_MOVED',
            title: 'Task Moved',
            message: `Task "${payload.task?.title || 'Task'}" was moved`,
            boardId,
            taskId: payload.taskId,
          });
        }
      }
    };

    // 3. Task Updated (instant updates + field merging)
    const handleTaskUpdated = (payload: {
      boardId: string;
      taskId: string;
      task: Task;
      actorId?: string;
      opId?: string;
    }) => {
      if (payload.boardId === boardId) {
        if (payload.actorId === currentUserId && isPendingOp(payload.opId)) {
          return;
        }

        dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            const index = draft.data.findIndex((t: Task) => t._id === payload.taskId);
            if (index !== -1) {
              draft.data[index] = payload.task;
            }
          })
        );

        if (payload.actorId && payload.actorId !== currentUserId) {
          showToast({
            type: 'TASK_UPDATED',
            title: 'Task Updated',
            message: `Task "${payload.task.title}" updated`,
            boardId,
            taskId: payload.taskId,
          });
        }
      }
    };

    // 4. Task Deleted
    const handleTaskDeleted = (payload: {
      boardId: string;
      taskId: string;
      actorId?: string;
      opId?: string;
    }) => {
      if (payload.boardId === boardId) {
        if (payload.actorId === currentUserId && isPendingOp(payload.opId)) {
          return;
        }

        dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            draft.data = draft.data.filter((t: Task) => t._id !== payload.taskId);
          })
        );

        if (payload.actorId && payload.actorId !== currentUserId) {
          showToast({
            type: 'TASK_DELETED',
            title: 'Task Deleted',
            message: 'A task was deleted from this board',
            boardId,
            taskId: payload.taskId,
          });
        }
      }
    };

    // 5. Comments
    const handleCommentCreated = (payload: { taskId: string }) => {
      dispatch(commentApi.util.invalidateTags([{ type: 'Comment', id: payload.taskId }]));
      dispatch(
        taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
          const task = draft.data.find((t: Task) => t._id === payload.taskId);
          if (task) {
            task.commentCount = (task.commentCount || 0) + 1;
          }
        })
      );
    };

    // 6. Online Members (Presence)
    const handleUserJoined = (user: { userId: string; userName: string }) => {
      setOnlineMembers((prev) => Array.from(new Set([...prev, user.userId])));
    };

    const handleUserLeft = (user: { userId: string; userName: string }) => {
      setOnlineMembers((prev) => prev.filter((id) => id !== user.userId));
    };

    const handlePresenceUpdate = (payload: { boardId: string; onlineUsers: string[] }) => {
      setOnlineMembers(payload.onlineUsers);
    };

    // 7. Typing Indicators (with auto-expiry)
    const handleTypingStart = (payload: { taskId?: string; userId: string; userName: string }) => {
      if (!payload.taskId || payload.userId === currentUserId) return;
      const tId = payload.taskId;

      setTypingUsersMap((prev) => {
        const users = prev[tId] ?? [];
        if (users.some((u) => u.userId === payload.userId)) return prev;
        return { ...prev, [tId]: [...users, { userId: payload.userId, userName: payload.userName }] };
      });
    };

    const handleTypingStop = (payload: { taskId?: string; userId: string }) => {
      if (!payload.taskId) return;
      const tId = payload.taskId;

      setTypingUsersMap((prev) => {
        const users = (prev[tId] ?? []).filter((u) => u.userId !== payload.userId);
        if (users.length === 0) {
          const { [tId]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [tId]: users };
      });
    };

    // 8. Live Task Movement (task:drag:started / task:drag:ended)
    const handleDragStarted = (payload: {
      boardId: string;
      taskId: string;
      userId: string;
      userName: string;
    }) => {
      if (payload.boardId === boardId && payload.userId !== currentUserId) {
        setDraggingTasks((prev) => ({
          ...prev,
          [payload.taskId]: { userId: payload.userId, userName: payload.userName },
        }));
      }
    };

    const handleDragEnded = (payload: {
      boardId: string;
      taskId: string;
      userId: string;
    }) => {
      if (payload.boardId === boardId) {
        setDraggingTasks((prev) => {
          const { [payload.taskId]: _removed, ...rest } = prev;
          return rest;
        });
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('comment:created', handleCommentCreated);
    socket.on('board:user-joined', handleUserJoined);
    socket.on('board:user-left', handleUserLeft);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('task:drag:started', handleDragStarted);
    socket.on('task:drag:ended', handleDragEnded);

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('comment:created', handleCommentCreated);
      socket.off('board:user-joined', handleUserJoined);
      socket.off('board:user-left', handleUserLeft);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('task:drag:started', handleDragStarted);
      socket.off('task:drag:ended', handleDragEnded);

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, [boardId, token, currentUserId, dispatch, refreshBoard]);

  const emitTypingStart = useCallback(
    (taskId: string) => {
      const socket = getSocket();
      if (!boardId || !socket.connected) return;

      socket.emit('typing:start', { boardId, taskId });

      if (typingTimersRef.current[taskId]) {
        clearTimeout(typingTimersRef.current[taskId]);
      }

      typingTimersRef.current[taskId] = setTimeout(() => {
        socket.emit('typing:stop', { boardId, taskId });
        delete typingTimersRef.current[taskId];
      }, 2500);
    },
    [boardId]
  );

  const emitTypingStop = useCallback(
    (taskId: string) => {
      const socket = getSocket();
      if (!boardId || !socket.connected) return;

      if (typingTimersRef.current[taskId]) {
        clearTimeout(typingTimersRef.current[taskId]);
        delete typingTimersRef.current[taskId];
      }

      socket.emit('typing:stop', { boardId, taskId });
    },
    [boardId]
  );

  const emitDragStart = useCallback(
    (taskId: string) => {
      const socket = getSocket();
      if (!boardId || !socket.connected) return;
      socket.emit('task:drag:start', { boardId, taskId });
    },
    [boardId]
  );

  const emitDragEnd = useCallback(
    (taskId: string) => {
      const socket = getSocket();
      if (!boardId || !socket.connected) return;
      socket.emit('task:drag:end', { boardId, taskId });
    },
    [boardId]
  );

  return {
    connectionStatus,
    onlineMembers,
    typingUsersMap,
    draggingTasks,
    emitTypingStart,
    emitTypingStop,
    emitDragStart,
    emitDragEnd,
    refreshBoard,
  };
};

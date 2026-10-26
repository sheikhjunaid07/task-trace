import { baseApi } from './baseApi';
import type { Task } from '../types';

export interface TasksListResponse {
  statusCode: number;
  message: string;
  data: Task[];
}

export interface SingleTaskResponse {
  statusCode: number;
  message: string;
  data: Task;
}

const pendingOpIds = new Set<string>();

export const registerPendingOp = (opId: string): void => {
  pendingOpIds.add(opId);
  setTimeout(() => pendingOpIds.delete(opId), 30000);
};

export const isPendingOp = (opId?: string): boolean => {
  return !!opId && pendingOpIds.has(opId);
};

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoardTasks: builder.query<TasksListResponse, string>({
      query: (boardId) => `/tasks/board/${boardId}`,
      providesTags: (result, _error, boardId) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
              { type: 'Task', id: `BOARD_${boardId}` },
            ]
          : [{ type: 'Task', id: `BOARD_${boardId}` }],
    }),
    createTask: builder.mutation<
      SingleTaskResponse,
      { boardId: string; columnId: string; title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical'; dueDate?: string | null; assignees?: string[]; opId?: string }
    >({
      query: ({ boardId, columnId, ...body }) => {
        const opId = body.opId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `op_${Date.now()}_${Math.random()}`);
        registerPendingOp(opId);
        return {
          url: `/tasks/board/${boardId}/column/${columnId}`,
          method: 'POST',
          body: { ...body, opId },
        };
      },
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    updateTask: builder.mutation<
      SingleTaskResponse,
      { taskId: string; boardId: string; title?: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical'; dueDate?: string | null; assignees?: string[]; labels?: string[]; version?: number; opId?: string }
    >({
      query: ({ taskId, boardId: _boardId, ...body }) => {
        const opId = body.opId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `op_${Date.now()}_${Math.random()}`);
        registerPendingOp(opId);
        return {
          url: `/tasks/${taskId}`,
          method: 'PATCH',
          body: { ...body, opId },
        };
      },
      async onQueryStarted({ taskId, boardId, title, description, priority, dueDate, version }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            const task = draft.data.find((t: Task) => t._id === taskId);
            if (task) {
              if (title !== undefined) task.title = title;
              if (description !== undefined) task.description = description;
              if (priority !== undefined) task.priority = priority;
              if (dueDate !== undefined) task.dueDate = dueDate;
              if (version !== undefined) task.version = version + 1;
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(
              taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
                const index = draft.data.findIndex((t: Task) => t._id === taskId);
                if (index !== -1) {
                  draft.data[index] = data.data;
                }
              })
            );
          }
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { taskId, boardId }) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    moveTask: builder.mutation<
      SingleTaskResponse,
      { taskId: string; boardId: string; columnId: string; position?: number; opId?: string }
    >({
      query: ({ taskId, columnId, position, opId: customOpId }) => {
        const opId = customOpId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `op_${Date.now()}_${Math.random()}`);
        registerPendingOp(opId);
        return {
          url: `/tasks/${taskId}/move`,
          method: 'PATCH',
          body: { columnId, position, opId },
        };
      },
      async onQueryStarted({ taskId, boardId, columnId, position }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            const task = draft.data.find((t: Task) => t._id === taskId);
            if (task) {
              task.columnId = columnId;
              if (position !== undefined) {
                task.position = position;
              }
              draft.data.sort((a: Task, b: Task) => (a.position - b.position || a._id.localeCompare(b._id)));
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          if (data?.data) {
            dispatch(
              taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
                const index = draft.data.findIndex((t: Task) => t._id === taskId);
                if (index !== -1) {
                  draft.data[index] = { ...draft.data[index], ...data.data };
                }
              })
            );
          }
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { taskId, boardId }) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    deleteTask: builder.mutation<{ statusCode: number; message: string }, { taskId: string; boardId: string; opId?: string }>({
      query: ({ taskId, opId: customOpId }) => {
        const opId = customOpId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `op_${Date.now()}_${Math.random()}`);
        registerPendingOp(opId);
        return {
          url: `/tasks/${taskId}`,
          method: 'DELETE',
          body: { opId },
        };
      },
      async onQueryStarted({ taskId, boardId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskApi.util.updateQueryData('getBoardTasks', boardId, (draft) => {
            const index = draft.data.findIndex((t: Task) => t._id === taskId);
            if (index !== -1) {
              draft.data.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { taskId, boardId }) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    archiveTask: builder.mutation<
      SingleTaskResponse,
      { taskId: string; boardId: string; isArchived?: boolean }
    >({
      query: ({ taskId, isArchived = true }) => ({
        url: `/tasks/${taskId}/archive`,
        method: 'PATCH',
        body: { isArchived },
      }),
      invalidatesTags: (_result, _error, { taskId, boardId }) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
        { type: 'Board', id: `ARCHIVES_${boardId}` },
      ],
    }),
  }),
});

export const {
  useGetBoardTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useArchiveTaskMutation,
} = taskApi;

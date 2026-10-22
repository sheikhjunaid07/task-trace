import { baseApi } from './baseApi';
import type { Board, Invitation, User } from '../types';

export interface SingleBoardResponse {
  statusCode: number;
  message: string;
  data: Board;
}

export interface BoardsListResponse {
  statusCode: number;
  message: string;
  data: Board[];
}

export interface PendingInvitationsResponse {
  statusCode: number;
  message: string;
  data: Invitation[];
}

export interface BoardPreviewResponse {
  statusCode: number;
  message: string;
  data: {
    boardId: string;
    title: string;
    description?: string;
    owner: User;
    membersCount: number;
    inviteCode: string;
  };
}

export interface DashboardStatsResponse {
  statusCode: number;
  message: string;
  data: {
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
    upcomingDeadlines: any[];
    recentActivities: any[];
    projects: (Board & {
      tasksCount: number;
      doneCount: number;
      progressCount: number;
      todoCount: number;
      completionRate: number;
    })[];
  };
}

export interface WorkspaceMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'Admin' | 'Member';
  boards: string[];
  boardIds: string[];
}

export interface WorkspaceMembersResponse {
  statusCode: number;
  message: string;
  data: WorkspaceMember[];
}

export const boardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaceMembers: builder.query<WorkspaceMembersResponse, void>({
      query: () => '/boards/workspace/members',
      providesTags: [{ type: 'Board', id: 'LIST' }],
    }),
    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => '/boards/dashboard/stats',
      providesTags: [{ type: 'Board', id: 'LIST' }, { type: 'Task', id: 'LIST' }],
    }),
    getBoards: builder.query<BoardsListResponse, void>({
      query: () => '/boards',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Board' as const, id: _id })),
              { type: 'Board', id: 'LIST' },
            ]
          : [{ type: 'Board', id: 'LIST' }],
    }),
    getBoardById: builder.query<SingleBoardResponse, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Board', id }],
    }),
    createBoard: builder.mutation<SingleBoardResponse, { name?: string; title?: string; description?: string }>({
      query: (body) => ({
        url: '/boards',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Board', id: 'LIST' }, { type: 'Notification', id: 'LIST' }],
    }),
    inviteMember: builder.mutation<{ statusCode: number; message: string; data: Invitation }, { boardId: string; email: string }>({
      query: ({ boardId, email }) => ({
        url: `/boards/${boardId}/members`,
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Invitation', id: `BOARD_${boardId}` },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
    removeMember: builder.mutation<SingleBoardResponse, { boardId: string; memberId: string }>({
      query: ({ boardId, memberId }) => ({
        url: `/boards/${boardId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    deleteBoard: builder.mutation<{ statusCode: number; message: string }, string>({
      query: (boardId) => ({
        url: `/boards/${boardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Board', id: 'LIST' }, { type: 'Notification', id: 'LIST' }],
    }),

    // Column Management Mutations
    addColumn: builder.mutation<SingleBoardResponse, { boardId: string; name: string }>({
      query: ({ boardId, name }) => ({
        url: `/boards/${boardId}/columns`,
        method: 'POST',
        body: { name },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    renameColumn: builder.mutation<SingleBoardResponse, { boardId: string; columnId: string; name: string }>({
      query: ({ boardId, columnId, name }) => ({
        url: `/boards/${boardId}/columns/${columnId}`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    removeColumn: builder.mutation<SingleBoardResponse, { boardId: string; columnId: string }>({
      query: ({ boardId, columnId }) => ({
        url: `/boards/${boardId}/columns/${columnId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    reorderColumns: builder.mutation<SingleBoardResponse, { boardId: string; columnIds: string[] }>({
      query: ({ boardId, columnIds }) => ({
        url: `/boards/${boardId}/columns/reorder`,
        method: 'PATCH',
        body: { columnIds },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),

    // Invitations & Share Link Endpoints
    getPendingInvitations: builder.query<PendingInvitationsResponse, void>({
      query: () => '/boards/invitations/pending',
      providesTags: [{ type: 'Invitation', id: 'PENDING' }],
    }),
    getBoardInvitations: builder.query<PendingInvitationsResponse, string>({
      query: (boardId) => `/boards/${boardId}/invitations`,
      providesTags: (_result, _error, boardId) => [{ type: 'Invitation', id: `BOARD_${boardId}` }],
    }),
    respondInvitation: builder.mutation<
      { statusCode: number; message: string; data: { invitation: Invitation; board: Board } },
      { invitationId: string; action: 'accept' | 'decline' }
    >({
      query: ({ invitationId, action }) => ({
        url: `/boards/invitations/${invitationId}/respond`,
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: [{ type: 'Invitation', id: 'PENDING' }, { type: 'Board', id: 'LIST' }],
    }),

    // Shareable Board Link Endpoints
    getBoardInviteCode: builder.query<{ statusCode: number; message: string; data: { inviteCode: string } }, string>({
      query: (boardId) => `/boards/${boardId}/invite-code`,
    }),
    getBoardPreview: builder.query<BoardPreviewResponse, string>({
      query: (inviteCode) => `/boards/join-preview/${inviteCode}`,
    }),
    joinBoardByInviteCode: builder.mutation<{ statusCode: number; message: string; data: { boardId: string } }, string>({
      query: (inviteCode) => ({
        url: `/boards/join-code/${inviteCode}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Board', id: 'LIST' }],
    }),
    regenerateInviteCode: builder.mutation<{ statusCode: number; message: string; data: { inviteCode: string } }, string>({
      query: (boardId) => ({
        url: `/boards/${boardId}/regenerate-invite-code`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, boardId) => [{ type: 'Board', id: boardId }],
    }),
    joinWorkspace: builder.mutation<
      { statusCode: number; message: string; data: { boardId: string; board: Board } },
      { workspaceName?: string; boardId?: string; inviteCode?: string }
    >({
      query: (body) => ({
        url: '/boards/join-workspace',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Board', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetWorkspaceMembersQuery,
  useGetDashboardStatsQuery,
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useDeleteBoardMutation,
  useAddColumnMutation,
  useRenameColumnMutation,
  useRemoveColumnMutation,
  useReorderColumnsMutation,
  useGetPendingInvitationsQuery,
  useGetBoardInvitationsQuery,
  useRespondInvitationMutation,
  useGetBoardInviteCodeQuery,
  useGetBoardPreviewQuery,
  useJoinBoardByInviteCodeMutation,
  useRegenerateInviteCodeMutation,
  useJoinWorkspaceMutation,
} = boardApi;

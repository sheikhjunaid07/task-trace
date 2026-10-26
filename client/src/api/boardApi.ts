import { baseApi } from './baseApi';
import type { Board, Invitation, User, Column, BoardLabel, Task } from '../types';

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
      invalidatesTags: [{ type: 'Board', id: 'LIST' }],
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
      ],
    }),
    removeMember: builder.mutation<SingleBoardResponse, { boardId: string; memberId: string }>({
      query: ({ boardId, memberId }) => ({
        url: `/boards/${boardId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    updateBoard: builder.mutation<
      SingleBoardResponse,
      {
        boardId: string;
        name?: string;
        title?: string;
        description?: string;
        color?: string;
        avatarUrl?: string | null;
        visibility?: 'public' | 'private';
        labels?: BoardLabel[];
      }
    >({
      query: ({ boardId, ...body }) => ({
        url: `/boards/${boardId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Board', id: 'LIST' },
      ],
    }),
    updateMemberRole: builder.mutation<
      { statusCode: number; message: string; data: { userId: string; role: string } },
      { boardId: string; userId: string; role: 'admin' | 'member' | 'viewer' }
    >({
      query: ({ boardId, userId, role }) => ({
        url: `/boards/${boardId}/members/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    transferOwnership: builder.mutation<SingleBoardResponse, { boardId: string; newOwnerId: string }>({
      query: ({ boardId, newOwnerId }) => ({
        url: `/boards/${boardId}/transfer-ownership`,
        method: 'POST',
        body: { newOwnerId },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Board', id: 'LIST' },
      ],
    }),
    deleteBoard: builder.mutation<{ statusCode: number; message: string }, string>({
      query: (boardId) => ({
        url: `/boards/${boardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Board', id: 'LIST' }],
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

    // WIP Limits & Column Archiving
    updateColumnWipLimit: builder.mutation<
      { statusCode: number; message: string; data: Column },
      { boardId: string; columnId: string; wipLimit: number | null }
    >({
      query: ({ boardId, columnId, wipLimit }) => ({
        url: `/boards/${boardId}/columns/${columnId}/wip-limit`,
        method: 'PATCH',
        body: { wipLimit },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    archiveColumn: builder.mutation<
      { statusCode: number; message: string; data: Column },
      { boardId: string; columnId: string; isArchived: boolean }
    >({
      query: ({ boardId, columnId, isArchived }) => ({
        url: `/boards/${boardId}/columns/${columnId}/archive`,
        method: 'PATCH',
        body: { isArchived },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Board', id: `ARCHIVES_${boardId}` },
      ],
    }),

    // Archives Management
    getBoardArchives: builder.query<
      { statusCode: number; message: string; data: { tasks: Task[]; columns: Column[] } },
      string
    >({
      query: (boardId) => `/boards/${boardId}/archives`,
      providesTags: (_result, _error, boardId) => [{ type: 'Board', id: `ARCHIVES_${boardId}` }],
    }),
    restoreArchivedItem: builder.mutation<
      { statusCode: number; message: string; data: any },
      { boardId: string; type: 'task' | 'column'; itemId: string }
    >({
      query: ({ boardId, type, itemId }) => ({
        url: `/boards/${boardId}/archives/restore`,
        method: 'POST',
        body: { type, itemId },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Board', id: `ARCHIVES_${boardId}` },
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    permanentDeleteArchivedItem: builder.mutation<
      { statusCode: number; message: string; data: null },
      { boardId: string; type: 'task' | 'column'; itemId: string }
    >({
      query: ({ boardId, type, itemId }) => ({
        url: `/boards/${boardId}/archives/permanent`,
        method: 'DELETE',
        body: { type, itemId },
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'Board', id: `ARCHIVES_${boardId}` },
        { type: 'Task', id: `BOARD_${boardId}` },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetWorkspaceMembersQuery,
  useGetDashboardStatsQuery,
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useUpdateMemberRoleMutation,
  useTransferOwnershipMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useDeleteBoardMutation,
  useAddColumnMutation,
  useRenameColumnMutation,
  useRemoveColumnMutation,
  useReorderColumnsMutation,
  useUpdateColumnWipLimitMutation,
  useArchiveColumnMutation,
  useGetBoardArchivesQuery,
  useRestoreArchivedItemMutation,
  usePermanentDeleteArchivedItemMutation,
  useGetPendingInvitationsQuery,
  useGetBoardInvitationsQuery,
  useRespondInvitationMutation,
  useGetBoardInviteCodeQuery,
  useGetBoardPreviewQuery,
  useJoinBoardByInviteCodeMutation,
  useRegenerateInviteCodeMutation,
  useJoinWorkspaceMutation,
} = boardApi;

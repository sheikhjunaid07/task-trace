import { baseApi } from "./baseApi";
import type { AppNotification } from "../types";

export interface NotificationsResponse {
  statusCode: number;
  message: string;
  data: {
    notifications: AppNotification[];
    unreadCount: number;
  };
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, void>({
      query: () => "/notifications",
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAsRead: builder.mutation<
      { statusCode: number; message: string },
      string
    >({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAllAsRead: builder.mutation<
      { statusCode: number; message: string },
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    deleteNotification: builder.mutation<
      { statusCode: number; message: string },
      string
    >({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    clearAllNotifications: builder.mutation<
      { statusCode: number; message: string },
      void
    >({
      query: () => ({
        url: "/notifications/clear-all",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} = notificationApi;

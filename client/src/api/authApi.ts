import { baseApi } from "./baseApi";
import type { User } from "../types";

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      AuthResponse,
      { name: string; email: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    getMe: builder.query<
      { statusCode: number; message: string; data: User },
      void
    >({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    forgotPassword: builder.mutation<
      { statusCode: number; message: string },
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      { statusCode: number; message: string },
      { token: string; password: string }
    >({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;

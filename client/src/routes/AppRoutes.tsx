import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { ProtectedRoute } from "./ProtectedRoute";

const LandingPage = lazy(() =>
  import("../features/landing/LandingPage").then((m) => ({
    default: m.LandingPage,
  })),
);
const LoginPage = lazy(() =>
  import("../features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("../features/auth/pages/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const BoardsListPage = lazy(() =>
  import("../features/board/pages/BoardsListPage").then((m) => ({
    default: m.BoardsListPage,
  })),
);
const BoardPage = lazy(() =>
  import("../features/board/pages/BoardPage").then((m) => ({
    default: m.BoardPage,
  })),
);
const JoinBoardPage = lazy(() =>
  import("../features/board/pages/JoinBoardPage").then((m) => ({
    default: m.JoinBoardPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../features/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const TeamMembersPage = lazy(() =>
  import("../features/team/pages/TeamMembersPage").then((m) => ({
    default: m.TeamMembersPage,
  })),
);
const ProjectSettingsPage = lazy(() =>
  import("../features/settings/pages/ProjectSettingsPage").then((m) => ({
    default: m.ProjectSettingsPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../features/notFound/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  })),
);

const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] w-full flex items-center justify-center p-8">
    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
  </div>
);

function JoinRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const workspace =
    searchParams.get("workspace") || searchParams.get("inviteWorkspace");
  const inviteCode = searchParams.get("inviteCode");

  if (inviteCode) {
    return <Navigate to={`/boards/join/${inviteCode}`} replace />;
  }
  if (isAuthenticated) {
    return (
      <Navigate
        to={`/dashboard${workspace ? `?inviteWorkspace=${encodeURIComponent(workspace)}` : ""}`}
        replace
      />
    );
  }
  return (
    <Navigate
      to={`/register${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ""}`}
      replace
    />
  );
}

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Public / Authenticated Join Routes */}
        <Route path="/join" element={<JoinRoute />} />
        <Route path="/join/:inviteCode" element={<JoinBoardPage />} />
        <Route path="/boards/join/:inviteCode" element={<JoinBoardPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boards" element={<BoardsListPage />} />
          <Route path="/projects" element={<BoardsListPage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
          <Route
            path="/boards/:boardId/settings"
            element={<ProjectSettingsPage />}
          />
          <Route path="/settings" element={<ProjectSettingsPage />} />
          <Route path="/team" element={<TeamMembersPage />} />
          <Route path="/members" element={<TeamMembersPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

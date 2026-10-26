import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { BoardsListPage } from '../features/board/pages/BoardsListPage';
import { BoardPage } from '../features/board/pages/BoardPage';
import { JoinBoardPage } from '../features/board/pages/JoinBoardPage';
import { LandingPage } from '../features/landing/LandingPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { TeamMembersPage } from '../features/team/pages/TeamMembersPage';
import { ProjectSettingsPage } from '../features/settings/pages/ProjectSettingsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFoundPage } from '../features/notFound/NotFoundPage';

function JoinRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const workspace = searchParams.get('workspace') || searchParams.get('inviteWorkspace');
  const inviteCode = searchParams.get('inviteCode');

  if (inviteCode) {
    return <Navigate to={`/boards/join/${inviteCode}`} replace />;
  }
  if (isAuthenticated) {
    return (
      <Navigate
        to={`/dashboard${workspace ? `?inviteWorkspace=${encodeURIComponent(workspace)}` : ''}`}
        replace
      />
    );
  }
  return (
    <Navigate
      to={`/register${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`}
      replace
    />
  );
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public / Authenticated Join Routes */}
      <Route path="/join" element={<JoinRoute />} />
      <Route path="/join/:inviteCode" element={<JoinBoardPage />} />
      <Route path="/boards/join/:inviteCode" element={<JoinBoardPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/boards" element={<BoardsListPage />} />
        <Route path="/projects" element={<BoardsListPage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/boards/:boardId/settings" element={<ProjectSettingsPage />} />
        <Route path="/settings" element={<ProjectSettingsPage />} />
        <Route path="/team" element={<TeamMembersPage />} />
        <Route path="/members" element={<TeamMembersPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

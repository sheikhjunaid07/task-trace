import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import { LeftSidebar } from '../components/LeftSidebar';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] max-w-full overflow-x-hidden">
      <LeftSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden pb-16 md:pb-0">
        <Outlet />
      </div>
    </div>
  );
};

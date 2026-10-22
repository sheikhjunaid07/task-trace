import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingNavbar } from './features/landing/components/LandingNavbar';
import { PendingInvitationsBanner } from './components/PendingInvitationsBanner';
import { InvitePopupModal } from './components/InvitePopupModal';
import { ToastNotificationContainer } from './components/ToastNotification';
import { AppRoutes } from './routes/AppRoutes';
import { useAppSelector } from './app/hooks';
import { connectSocket, disconnectSocket } from './sockets/socket';

function Shell() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col font-sans">
      {isLanding ? <LandingNavbar /> : <Navbar />}
      {!isLanding && <PendingInvitationsBanner />}
      <InvitePopupModal />
      <ToastNotificationContainer />
      <main className="flex-1">
        <AppRoutes />
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;
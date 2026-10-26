import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useAppSelector } from './app/hooks';

const Navbar = lazy(() => import('./components/Navbar').then((m) => ({ default: m.Navbar })));
const PendingInvitationsBanner = lazy(() =>
  import('./components/PendingInvitationsBanner').then((m) => ({ default: m.PendingInvitationsBanner }))
);
const InvitePopupModal = lazy(() =>
  import('./components/InvitePopupModal').then((m) => ({ default: m.InvitePopupModal }))
);
const ToastNotificationContainer = lazy(() =>
  import('./components/ToastNotification').then((m) => ({ default: m.ToastNotificationContainer }))
);

function Shell() {
  const { pathname, search } = useLocation();
  const isLanding = pathname === '/';
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      import('./sockets/socket').then(({ connectSocket }) => {
        connectSocket(token);
      });
    } else {
      import('./sockets/socket').then(({ disconnectSocket }) => {
        disconnectSocket();
      });
    }
  }, [isAuthenticated, token]);

  const showInviteModal = !isLanding || search.includes('invite') || search.includes('workspace');

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col font-sans">
      {!isLanding && (
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
      )}
      {!isLanding && (
        <Suspense fallback={null}>
          <PendingInvitationsBanner />
        </Suspense>
      )}
      {showInviteModal && (
        <Suspense fallback={null}>
          <InvitePopupModal />
        </Suspense>
      )}
      {!isLanding && (
        <Suspense fallback={null}>
          <ToastNotificationContainer />
        </Suspense>
      )}
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
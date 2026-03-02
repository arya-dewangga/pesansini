import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateRoomPage from './pages/CreateRoomPage';
import RoomDetailPage from './pages/RoomDetailPage';
import RoomPage from './pages/RoomPage';
import OrderFormPage from './pages/OrderFormPage';
import JoinOrCreateRoomPage from './pages/JoinOrCreateRoomPage';
import EditOrderPage from './pages/EditOrderPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import DonationPage from './pages/DonationPage';
import EditProfilePage from './pages/EditProfilePage';
import SecurityPage from './pages/SecurityPage';
import JoinRedirectPage from './pages/JoinRedirectPage';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (currentUser) {
    // Redirect to the page they came from, or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/create-room" element={<ProtectedRoute><CreateRoomPage /></ProtectedRoute>} />
      <Route path="/room/:id" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
      <Route path="/room/:id/details" element={<ProtectedRoute><RoomDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
      <Route path="/profile/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/donation" element={<ProtectedRoute><DonationPage /></ProtectedRoute>} />

      {/* Order pages */}
      <Route path="/room/:id/form" element={<ProtectedRoute><OrderFormPage /></ProtectedRoute>} />
      <Route path="/room/:roomId/order/:orderId/edit" element={<ProtectedRoute><EditOrderPage /></ProtectedRoute>} />
      <Route path="/join" element={<ProtectedRoute><JoinOrCreateRoomPage /></ProtectedRoute>} />

      {/* Short Link Redirect */}
      <Route path="/j/:code" element={<ProtectedRoute><JoinRedirectPage /></ProtectedRoute>} />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '1rem',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

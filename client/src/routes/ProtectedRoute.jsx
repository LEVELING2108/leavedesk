import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/States';

// UX guard only: the API enforces every role check itself
export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Keeps signed-in users off the login/register pages
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Checking your session…" />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

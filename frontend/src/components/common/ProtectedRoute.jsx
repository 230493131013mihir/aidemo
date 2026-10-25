import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole, requireAuth = false }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-spin">
          <Sprout className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-muted">Verifying session credentials...</p>
      </div>
    );
  }

  // Strict Security: Unauthenticated visitors cannot access protected features without logging in
  // Any unauthenticated attempt to access dashboard, prices, transport, etc. redirects directly to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin routes strictly require verified administrator credentials
  if (requiredRole === 'admin') {
    if (user?.role !== 'admin' || user?.isGuest) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // FPO routes strictly require verified FPO leader or administrator credentials
  if (requiredRole === 'fpo' || requiredRole === 'fpo_leader') {
    if (user?.role !== 'fpo_leader' && user?.role !== 'fpo' && user?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Profile strictly requires verified authentication
  if (requiredRole === 'auth' || (requireAuth && (!isAuthenticated || user?.isGuest))) {
    if (!isAuthenticated || user?.isGuest) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // Allow shared pages without role blocking
  const SHARED_PATHS = ['/dashboard', '/markets', '/prices', '/weather', '/chat', '/assistant', '/profile', '/schemes', '/farmer/schemes'];
  const isSharedPage = SHARED_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));

  if (!isSharedPage && user?.role !== 'admin') {
    // Farmer-specific pages (crop harvest simulator / management) - guard for non-farmers
    const isFarmerOnly = location.pathname.startsWith('/harvest') || location.pathname.startsWith('/simulator') || requiredRole === 'farmer';
    if (isFarmerOnly && user?.role !== 'farmer') {
      return <Navigate to="/dashboard" replace />;
    }

    // Transporter-specific pages
    if (requiredRole === 'transporter' && user?.role !== 'transporter') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

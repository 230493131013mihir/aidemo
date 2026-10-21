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

  // Profile strictly requires verified authentication
  if (requiredRole === 'auth' || (requireAuth && (!isAuthenticated || user?.isGuest))) {
    if (!isAuthenticated || user?.isGuest) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // Role validation for transporter
  if (requiredRole === 'transporter' && user?.role !== 'transporter' && !user?.isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

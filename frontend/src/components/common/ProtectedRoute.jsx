import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
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

  // Strict Lockdown: If not logged in, NEVER show any dashboard layout. Immediately redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user?.role === 'transporter') {
      return <Navigate to="/transport" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

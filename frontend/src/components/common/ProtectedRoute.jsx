import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Sprout, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in">
        <div 
          className="relative rounded-3xl border border-primary/20 bg-white/95 p-8 sm:p-10 shadow-2xl text-center space-y-6 overflow-hidden backdrop-blur-xl"
          style={{
            boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.08)'
          }}
        >
          {/* Subtle glow background */}
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Lock Icon */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-primary/25">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Farmer Account Required</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight">
              Please Sign In to Access This Page
            </h2>

            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
              Personalized farmer profiles, real-time harvest profit calculators, and pooled vehicle transport are securely reserved for registered users.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              state={{ from: location }}
              className="btn-primary w-full sm:w-auto py-3 px-8 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              <span>Login to My Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="btn-secondary w-full sm:w-auto py-3 px-8 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-300"
            >
              <Sprout className="w-4 h-4 text-primary" />
              <span>Create Free Farmer Account</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-border/80 text-xs text-muted">
            Want to see today&apos;s rates without logging in?{' '}
            <Link to="/markets" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Browse Public APMC Mandi Rates</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-lg space-y-4">
          <h2 className="text-xl font-bold text-red-700">Access Restricted</h2>
          <p className="text-xs text-muted">
            This workspace requires the <strong className="capitalize">{requiredRole}</strong> role. You are currently logged in as a <strong className="capitalize">{user?.role}</strong>.
          </p>
          <Link to="/dashboard" className="btn-primary inline-block py-2 px-6 rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

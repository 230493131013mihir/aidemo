import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, X } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import DashboardPreview from '../components/landing/DashboardPreview';
import CTASection from '../components/landing/CTASection';

export default function LandingPage() {
  const location = useLocation();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Handle smooth scroll when navigating with hash (e.g., /#features)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('harvestmitra_token'));
    const dismissed = sessionStorage.getItem('harvestmitra_auth_prompt_dismissed') === 'true';
    if (!hasToken && !dismissed) {
      const timer = setTimeout(() => setShowAuthPrompt(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function closePrompt() {
    sessionStorage.setItem('harvestmitra_auth_prompt_dismissed', 'true');
    setShowAuthPrompt(false);
  }

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Problem Overview */}
      <ProblemSection />

      {/* 3. Feature Cards Section */}
      <FeaturesSection />

      {/* 4. How It Works / Workflow */}
      <WorkflowSection />

      {/* 5. Dashboard Preview */}
      <DashboardPreview />

      {/* 6. Call To Action */}
      <CTASection />

      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-border shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={closePrompt}
              className="absolute right-3 top-3 p-2 rounded-lg text-muted hover:text-text hover:bg-secondary"
              aria-label="Close login prompt"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-3 pr-8">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Farmer Access
              </p>
              <h2 className="text-2xl font-extrabold text-text">
                Login or register to save your work
              </h2>
              <p className="text-sm text-muted">
                Farmers can save transport requests, manage their profile, and access protected tools after login.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <Link to="/login" className="btn-primary w-full" onClick={closePrompt}>
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn-secondary w-full" onClick={closePrompt}>
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={closePrompt}
              className="mt-4 w-full text-sm font-semibold text-muted hover:text-primary"
            >
              Continue without login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

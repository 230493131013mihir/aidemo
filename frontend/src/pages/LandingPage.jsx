import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import DashboardPreview from '../components/landing/DashboardPreview';
import CTASection from '../components/landing/CTASection';

export default function LandingPage() {
  const location = useLocation();

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
    </div>
  );
}

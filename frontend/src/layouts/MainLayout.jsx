import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/navigation/Header';
import Footer from '../components/navigation/Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text selection:bg-primary/20 selection:text-primary-dark">
      {/* Multilingual Header / Navbar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full" id="main-content">
        <Outlet />
      </main>

      {/* Multilingual Footer */}
      <Footer />
    </div>
  );
}

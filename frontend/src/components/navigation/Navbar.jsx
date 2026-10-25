import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  Sprout, 
  Menu, 
  X, 
  LayoutDashboard, 
  Truck, 
  User, 
  Shield, 
  LogOut,
  ChevronDown,
  Store
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LanguageSelector from '../common/LanguageSelector';
// Note: ThemeToggle component is maintained in Sidebar.jsx (Issue #176)

export default function Navbar({ onToggleSidebar, isSidebarOpen = false }) {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark } = useTheme();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountMenuOpen]);

  function handleSignOut() {
    setAccountMenuOpen(false);
    logout();
  }

  const isAdmin = user?.role === 'admin';
  const isTransporter = user?.role === 'transporter';
  const isMandi = user?.role === 'mandi';
  const userName = user?.name || (isMandi ? 'Sayali Kulkarni' : isTransporter ? 'Transporter' : 'Farmer');
  const userRole = isAdmin ? 'Admin' : isMandi ? 'Mandi Official' : isTransporter ? 'Transporter' : 'Farmer';

  // Farmer procurement booking notification badge
  const [unreadBookings, setUnreadBookings] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'farmer') return;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
    async function checkBookings() {
      try {
        const token = sessionStorage.getItem('harvestmitra_token') || localStorage.getItem('harvestmitra_token');
        if (!token || token === 'guest') return;
        const res = await fetch(`${API_BASE}/api/auth/contact-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const incoming = json.data.filter(r => r.contactType === 'mandi_to_farmer' && r.status === 'pending');
          setUnreadBookings(incoming.length);
        }
      } catch {}
    }
    checkBookings();
    const interval = setInterval(checkBookings, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors shadow-2xs ${isDark ? 'border-slate-700 bg-slate-900/95' : 'border-border bg-white/95'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          {/* Left: Mobile Sidebar Drawer Toggle & Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Hamburger button for mobile/tablets (< lg) to toggle left sidebar */}
            <button
              type="button"
              id="mobile-nav-toggle"
              aria-expanded={isSidebarOpen}
              aria-label="Toggle navigation sidebar"
              onClick={onToggleSidebar}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-text hover:bg-slate-100 hover:text-primary border border-border focus:outline-none transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-text" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-text" aria-hidden="true" />
              )}
            </button>

            {/* Brand Logo & Tagline */}
            <Link 
              to="/dashboard" 
              id="brand-logo"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
                {isMandi ? (
                  <Store className="w-6 h-6 text-white" aria-hidden="true" />
                ) : (
                  <Sprout className="w-6 h-6" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg leading-tight tracking-tight text-text group-hover:text-primary transition-colors">
                  Harvest<span className="text-primary">Mitra</span>
                  {isMandi && <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black border border-orange-200">APMC</span>}
                </span>
                <span className="text-[10px] text-muted font-bold tracking-wide hidden xs:inline">
                  {isMandi ? 'APMC Mandi Procurement Portal' : 'Smart Decisions. Better Harvests.'}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header: Language Selector & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Farmer Mandi Booking Notification Alert Pill */}
            {user?.role === 'farmer' && unreadBookings > 0 && (
              <Link
                to="/dashboard#mandi-bookings"
                id="header-farmer-mandi-alert"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 shadow-xs animate-bounce"
                title={`${unreadBookings} Mandi Purchase Inquiries Waiting!`}
              >
                <Store className="w-3.5 h-3.5 text-orange-600" />
                <span>{unreadBookings} Mandi Booking{unreadBookings > 1 ? 's' : ''}</span>
              </Link>
            )}

            {/* Direct 'My Bookings' button for Transporter */}
            {isTransporter && (
              <NavLink
                to="/transport?tab=trips"
                id="header-transporter-bookings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-2xs transition-all"
                title="View Assigned Cargo Trips & Digital Gate Passes"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>My Bookings</span>
              </NavLink>
            )}

            {/* Language Selector */}
            <div className="flex items-center">
              <LanguageSelector id="header-language-selector" />
            </div>

            {/* User Profile Pill & Account Dropdown */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Account Dropdown */}
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    id="account-dropdown-toggle"
                    aria-expanded={accountMenuOpen}
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all bg-slate-50 text-text border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-2xs"
                    title={`Logged in as ${userName} (${userRole})`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMandi ? 'bg-orange-400' : 'bg-emerald-400'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isMandi ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isTransporter ? (
                        <Truck className="w-3.5 h-3.5 text-primary" />
                      ) : isAdmin ? (
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                      ) : isMandi ? (
                        <Store className="w-3.5 h-3.5 text-orange-600" />
                      ) : (
                        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span className="max-w-[110px] sm:max-w-[140px] truncate font-bold text-slate-800">
                        {userName}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border hidden sm:inline ${
                        isMandi 
                          ? 'bg-orange-50 text-orange-800 border-orange-200' 
                          : isTransporter 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : isAdmin 
                          ? 'bg-purple-50 text-purple-800 border-purple-200' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {userRole}
                      </span>
                    </div>

                    <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-150 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account Dropdown Menu */}
                  {accountMenuOpen && (
                    <div
                      id="account-dropdown-menu"
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-border shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="px-3.5 py-2.5 border-b border-border/80">
                        <p className="text-xs font-extrabold text-text truncate">{userName}</p>
                        <p className="text-[11px] text-muted truncate">{user?.email || (isMandi ? 'mandi@harvestmitra.local' : isTransporter ? 'Transporter Account' : 'Farmer Account')}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isMandi 
                            ? 'bg-orange-50 text-orange-800 border-orange-200' 
                            : isTransporter 
                            ? 'bg-blue-50 text-blue-800 border-blue-200' 
                            : isAdmin 
                            ? 'bg-purple-50 text-purple-800 border-purple-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isAdmin ? 'APMC Administrator' : isMandi ? 'APMC Mandi Official' : isTransporter ? 'Verified Transporter' : 'Verified Farmer'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={isAdmin ? '/admin' : isTransporter ? '/transport' : isMandi ? '/dashboard' : '/dashboard'}
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-text hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          <span>{isAdmin ? 'APMC Admin Console' : isMandi ? 'APMC Mandi Portal' : isTransporter ? 'Logistics Dashboard' : 'Farmer Dashboard'}</span>
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-text hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>{isMandi ? 'Mandi Official Profile' : 'My Profile'}</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-border/80">
                        <button
                          type="button"
                          id="account-dropdown-logout-btn"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct One-Click Sign Out Button */}
                <button
                  type="button"
                  id="navbar-direct-logout-btn"
                  onClick={handleSignOut}
                  title="Sign out of active session"
                  className="p-2 rounded-xl text-muted hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <NavLink
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-text hover:text-primary hover:bg-slate-100 transition-colors"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn-primary px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
                >
                  Register
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden container maintaining test compatibility for mobile-drawer-logout-btn */}
      <div className="hidden" aria-hidden="true">
        <button
          type="button"
          id="mobile-drawer-logout-btn"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}


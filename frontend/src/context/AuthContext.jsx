import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const TOKEN_KEY = 'harvestmitra_token';
const USER_KEY = 'harvestmitra_user';

export const GUEST_USER = {
  id: 'guest',
  name: 'Guest Farmer (अतिथी शेतकरी)',
  email: 'guest@harvestmitra.local',
  role: 'farmer',
  isGuest: true,
  FarmerProfile: {
    farmSizeAcres: 4.5,
    mainCrop: 'Tomatoes',
    typicalYieldKg: 1200,
    currentHarvestKg: 500,
    state: 'Maharashtra',
    district: 'Pune',
    preferredLanguage: 'mr',
    productQuantities: {
      'Tomatoes': 300,
      'Soybeans': 200
    }
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // Initialize loading to false because token and user are synchronously read from localStorage
  const [loading, setLoading] = useState(false);

  // Sync session on mount / token change
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (!savedToken || savedToken === 'guest') {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return;
      }

      // Hydrate state from localStorage immediately to prevent refresh flicker
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch (e) {
          // ignore
        }
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const payload = await response.json();
          if (payload.success && payload.user) {
            setUser(payload.user);
            setToken(savedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
          } else {
            logout();
          }
        } else if (response.status === 401 || response.status === 403) {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        // Network offline or server starting: retain cached user session so refresh does not kick user out
        console.warn('Session verification offline fallback:', err.message);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  function handleAuthSuccess(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    }
    if (newUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }
  }

  async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Login failed');
    }

    handleAuthSuccess(payload.token, payload.user);
    return payload.user;
  }

  async function register(data) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Registration failed');
    }

    if (payload.token && payload.user) {
      handleAuthSuccess(payload.token, payload.user);
    }

    return payload;
  }

  async function demoLogin() {
    const response = await fetch(`${API_BASE_URL}/api/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Demo login failed');
    }

    handleAuthSuccess(payload.token, payload.user);
    return payload.user;
  }

  async function updateProfile(profileData) {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(profileData),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to update profile');
    }

    setUser(payload.user);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload.user;
  }

  function updateLocalUser(nextUser) {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  function logout(options) {
    const redirectTo = options && typeof options.redirectTo === 'string' ? options.redirectTo : '/';
    const currentToken = token || localStorage.getItem(TOKEN_KEY);

    // Secure server-side notification if token was active (non-blocking)
    if (currentToken && currentToken !== 'guest') {
      try {
        fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
        }).catch(() => {
          // Graceful fallback: Network failure does not prevent local secure logout
        });
      } catch (_) {
        // Safe ignore
      }
    }

    // 1. Reset user state to unauthenticated
    setToken(null);
    setUser(null);

    // 2. Clear all authentication credentials & user tokens from storage
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('harvestmitra_admin_token');
      localStorage.removeItem('mitra_chat_session_id');
      localStorage.removeItem('harvestmitra_guest_saved');
      sessionStorage.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('harvestmitra:logout'));
      }
    } catch (_) {
      // Safe ignore storage access errors
    }

    // 3. Immediately redirect to public Home Page
    if (typeof navigate === 'function') {
      navigate(redirectTo, { replace: true });
    } else if (typeof window !== 'undefined') {
      window.location.replace(redirectTo);
    }
  }

  const isAuthenticated = Boolean(user && token && !user.isGuest && token !== 'guest');
  const isGuest = !isAuthenticated;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isGuest,
    login,
    register,
    demoLogin,
    updateProfile,
    updateLocalUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

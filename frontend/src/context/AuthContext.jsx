import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || 'guest');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync session on mount / token change
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken || savedToken === 'guest') {
        setToken('guest');
        setUser((prev) => prev && !prev.isGuest ? prev : GUEST_USER);
        setLoading(false);
        return;
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
            setUser(GUEST_USER);
            setToken('guest');
          }
        } else {
          setUser(GUEST_USER);
          setToken('guest');
        }
      } catch (err) {
        console.warn('Session verification fallback to stored user:', err.message);
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

  async function sendOtp(data) {
    const response = await fetch(`${API_BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to dispatch verification code.');
    }
    return payload;
  }

  async function loginWithOtp(data) {
    const response = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Verification failed.');
    }
    handleAuthSuccess(payload.token, payload.user);
    return payload.user;
  }

  async function loginWithWhatsApp(data) {
    const response = await fetch(`${API_BASE_URL}/api/auth/whatsapp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'WhatsApp login failed.');
    }
    handleAuthSuccess(payload.token, payload.user);
    return payload.user;
  }

  async function linkAgristack(agristackId) {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken || currentToken === 'guest') throw new Error('Please sign in to link your Agristack ID.');

    const response = await fetch(`${API_BASE_URL}/api/auth/agristack/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ agristackId }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to link Agristack profile.');
    }

    if (payload.profile) {
      setUser((prev) => {
        const next = {
          ...prev,
          FarmerProfile: { ...(prev.FarmerProfile || {}), ...payload.profile }
        };
        localStorage.setItem(USER_KEY, JSON.stringify(next));
        return next;
      });
    }
    return payload;
  }

  function updateLocalUser(nextUser) {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  function logout() {
    setToken('guest');
    setUser(GUEST_USER);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const isGuest = Boolean(user?.isGuest || token === 'guest');
  const isAuthenticated = Boolean(user && token && !user.isGuest && token !== 'guest');

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isGuest,
    login,
    register,
    demoLogin,
    sendOtp,
    loginWithOtp,
    loginWithWhatsApp,
    linkAgristack,
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

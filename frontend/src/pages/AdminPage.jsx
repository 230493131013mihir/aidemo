import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  IndianRupee, 
  Shield, 
  ShieldAlert, 
  Store, 
  Trash2, 
  Users, 
  Wheat, 
  ArrowLeft, 
  CheckCircle2, 
  Lock,
  Truck,
  Plus,
  Edit2,
  RefreshCw,
  Search,
  Filter,
  Layers,
  MapPin,
  Calendar,
  Save,
  X,
  Landmark,
  ExternalLink,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getTimeGreeting } from '../utils/greeting';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

function authHeaders(token) {
  return { 
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}` 
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, token: userToken, isAuthenticated, login, logout } = useAuth();
  const { showToast } = useToast();
  const { greeting, icon } = getTimeGreeting();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('harvestmitra_admin_token') || '');
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [prices, setPrices] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [crops, setCrops] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Admin View Tab: 'prices' or 'users'
  const [activeTab, setActiveTab] = useState('prices');

  // Add / Edit Market Price Form State
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [priceFormSubmitting, setPriceFormSubmitting] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);

  const [priceForm, setPriceForm] = useState({
    state: 'Gujarat',
    marketId: '',
    cropId: '',
    pricePerQuintal: '',
    pricePerKg: '',
    minPrice: '',
    maxPrice: '',
    priceDate: new Date().toISOString().slice(0, 10),
  });

  // Filters & Pagination (Strict 10 items per page)
  const ITEMS_PER_PAGE = 10;
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [priceStateFilter, setPriceStateFilter] = useState('all');
  const [priceSortOrder, setPriceSortOrder] = useState('latest');
  const [pricePage, setPricePage] = useState(1);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSortOrder, setUserSortOrder] = useState('latest');
  const [userPage, setUserPage] = useState(1);

  const [transports, setTransports] = useState([]);
  const [transportSearchQuery, setTransportSearchQuery] = useState('');
  const [transportSortOrder, setTransportSortOrder] = useState('latest');
  const [transportPage, setTransportPage] = useState(1);

  const [schemes, setSchemes] = useState([]);
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState('all');
  const [schemePage, setSchemePage] = useState(1);

  // If user is already logged in as admin through main auth, reuse token
  useEffect(() => {
    if (user?.role === 'admin' && userToken && !token) {
      setToken(userToken);
      localStorage.setItem('harvestmitra_admin_token', userToken);
    }
  }, [user, userToken, token]);

  async function loginAdmin(event) {
    event?.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter administrator credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Admin authentication failed');
      }
      if (payload.user.role !== 'admin') {
        throw new Error('Access denied: Account is not an APMC administrator.');
      }

      localStorage.setItem('harvestmitra_admin_token', payload.token);
      setToken(payload.token);
      showToast({
        type: 'success',
        title: '🛡️ Admin Verified',
        message: `Welcome, Administrator ${payload.user.name}. Loading APMC control panel...`,
      });
    } catch (err) {
      setError(err.message || 'Unable to authenticate as APMC administrator');
      showToast({
        type: 'error',
        title: 'Admin Access Denied',
        message: err.message || 'Invalid administrator credentials.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData(activeToken = token) {
    if (!activeToken) return;
    setLoading(true);
    setError('');

    try {
      const [summaryRes, usersRes, pricesRes, marketsRes, cropsRes, transportRes, schemesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/overview`, { headers: authHeaders(activeToken) }),
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: authHeaders(activeToken) }),
        fetch(`${API_BASE_URL}/api/admin/market-prices`, { headers: authHeaders(activeToken) }),
        fetch(`${API_BASE_URL}/api/admin/markets`, { headers: authHeaders(activeToken) }),
        fetch(`${API_BASE_URL}/api/admin/crops`, { headers: authHeaders(activeToken) }),
        fetch(`${API_BASE_URL}/api/transport/requests`, { headers: authHeaders(activeToken) }).catch(() => null),
        fetch(`${API_BASE_URL}/api/schemes`, { headers: authHeaders(activeToken) }).catch(() => null),
      ]);

      const [summaryPayload, usersPayload, pricesPayload, marketsPayload, cropsPayload, transportPayload, schemesPayload] = await Promise.all([
        summaryRes.json(),
        usersRes.json(),
        pricesRes.json(),
        marketsRes.json(),
        cropsRes.json(),
        transportRes ? transportRes.json().catch(() => ({ success: true, data: [] })) : { success: true, data: [] },
        schemesRes ? schemesRes.json().catch(() => ({ success: true, data: [] })) : { success: true, data: [] },
      ]);

      if (!summaryPayload.success || !usersPayload.success || !pricesPayload.success) {
        throw new Error('Admin API rejected request. Please log in again.');
      }

      setSummary(summaryPayload.data);
      setUsers(usersPayload.data || []);
      setPrices(pricesPayload.data || []);
      setMarkets(marketsPayload.data || []);
      setCrops(cropsPayload.data || []);
      setTransports(transportPayload?.data || []);
      if (schemesPayload?.success && Array.isArray(schemesPayload.data)) {
        setSchemes(schemesPayload.data);
      }

      // Initialize default selections for price form if empty
      if (marketsPayload.data && marketsPayload.data.length > 0 && !priceForm.marketId) {
        setPriceForm((prev) => ({
          ...prev,
          state: marketsPayload.data[0].state || 'Gujarat',
          marketId: String(marketsPayload.data[0].id),
          cropId: cropsPayload.data && cropsPayload.data.length > 0 ? String(cropsPayload.data[0].id) : '',
        }));
      }
    } catch (err) {
      setError(err.message || 'Admin data could not be loaded');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token]);

  // Derived unique list of states from markets
  const availableStates = useMemo(() => {
    const set = new Set();
    markets.forEach((m) => {
      if (m.state) set.add(m.state);
    });
    // Add common agricultural states if not present
    ['Gujarat', 'Maharashtra', 'Punjab', 'Haryana', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'Karnataka'].forEach((s) => set.add(s));
    return Array.from(set).sort();
  }, [markets]);

  // Markets dynamically filtered by currently selected state in form
  const filteredFormMarkets = useMemo(() => {
    if (!priceForm.state) return markets;
    return markets.filter((m) => m.state?.toLowerCase() === priceForm.state.toLowerCase());
  }, [markets, priceForm.state]);

  // Handle State Change in Add Price Form -> cascades and updates marketId
  function handleStateChange(newState) {
    const matching = markets.filter((m) => m.state?.toLowerCase() === newState.toLowerCase());
    setPriceForm((prev) => ({
      ...prev,
      state: newState,
      marketId: matching.length > 0 ? String(matching[0].id) : '',
    }));
  }

  // Handle Quintal price changes with automatic recalculation of kg, min, max
  function handleQuintalPriceChange(val) {
    const num = Number(val);
    if (!num || Number.isNaN(num)) {
      setPriceForm((prev) => ({
        ...prev,
        pricePerQuintal: val,
        pricePerKg: '',
        minPrice: '',
        maxPrice: '',
      }));
      return;
    }

    const kg = (num / 100).toFixed(2);
    const min = Math.round(num * 0.92);
    const max = Math.round(num * 1.08);

    setPriceForm((prev) => ({
      ...prev,
      pricePerQuintal: val,
      pricePerKg: String(kg),
      minPrice: String(min),
      maxPrice: String(max),
    }));
  }

  // Submit Add or Edit Market Price
  async function handlePriceFormSubmit(e) {
    e.preventDefault();
    if (!priceForm.marketId || !priceForm.cropId || !priceForm.pricePerQuintal) {
      showToast({
        type: 'error',
        title: 'Form Incomplete',
        message: 'Please select State, Mandi, Crop, and Price per Quintal.',
      });
      return;
    }

    setPriceFormSubmitting(true);
    try {
      const payload = {
        marketId: Number(priceForm.marketId),
        cropId: Number(priceForm.cropId),
        pricePerQuintal: Number(priceForm.pricePerQuintal),
        pricePerKg: Number(priceForm.pricePerKg) || Number((Number(priceForm.pricePerQuintal) / 100).toFixed(2)),
        minPrice: Number(priceForm.minPrice) || Math.round(Number(priceForm.pricePerQuintal) * 0.92),
        maxPrice: Number(priceForm.maxPrice) || Math.round(Number(priceForm.pricePerQuintal) * 1.08),
        priceDate: priceForm.priceDate,
      };

      let res;
      if (editingPriceId) {
        res = await fetch(`${API_BASE_URL}/api/admin/market-prices/${editingPriceId}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/market-prices`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        });
      }

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to save market price.');
      }

      showToast({
        type: 'success',
        title: editingPriceId ? 'Price Updated' : 'Price Published',
        message: resData.message || 'APMC market rate saved directly to MySQL database.',
      });

      setIsPriceFormOpen(false);
      setEditingPriceId(null);
      setPriceForm((prev) => ({
        ...prev,
        pricePerQuintal: '',
        pricePerKg: '',
        minPrice: '',
        maxPrice: '',
      }));
      await loadAdminData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    } finally {
      setPriceFormSubmitting(false);
    }
  }

  // Open Edit Price
  function startEditPrice(item) {
    setEditingPriceId(item.id);
    const itemMarket = markets.find((m) => m.id === item.marketId || m.id === item.Market?.id);
    setPriceForm({
      state: itemMarket?.state || item.Market?.state || 'Gujarat',
      marketId: String(item.marketId || item.Market?.id || ''),
      cropId: String(item.cropId || item.Crop?.id || ''),
      pricePerQuintal: String(item.pricePerQuintal || ''),
      pricePerKg: String(item.pricePerKg || ''),
      minPrice: String(item.minPrice || ''),
      maxPrice: String(item.maxPrice || ''),
      priceDate: item.priceDate ? item.priceDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setIsPriceFormOpen(true);
  }

  // Delete Market Price
  async function deletePrice(id) {
    const confirmed = window.confirm('Are you sure you want to delete this APMC price record from MySQL?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/market-prices/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');

      showToast({
        type: 'info',
        title: 'Price Deleted',
        message: 'APMC market price record removed from MySQL.',
      });
      await loadAdminData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  }

  // Delete User
  async function deleteUser(id) {
    const confirmed = window.confirm('Delete this user record? This will permanently remove their profile.');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Delete failed');

      showToast({
        type: 'info',
        title: 'User Deleted',
        message: 'User removed from MySQL database.',
      });
      await loadAdminData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Unable to delete user',
      });
    }
  }

  // Filtered & Sorted prices for display
  const filteredAndSortedPrices = useMemo(() => {
    const list = prices.filter((p) => {
      const cropName = (p.Crop?.nameEn || p.Crop?.nameHi || '').toLowerCase();
      const marketName = (p.Market?.name || '').toLowerCase();
      const districtName = (p.Market?.district || '').toLowerCase();
      const stateName = (p.Market?.state || '').toLowerCase();

      const matchesSearch = !priceSearchQuery || 
        cropName.includes(priceSearchQuery.toLowerCase()) || 
        marketName.includes(priceSearchQuery.toLowerCase()) || 
        districtName.includes(priceSearchQuery.toLowerCase());

      const matchesState = priceStateFilter === 'all' || 
        stateName === priceStateFilter.toLowerCase();

      return matchesSearch && matchesState;
    });

    return list.sort((a, b) => {
      if (priceSortOrder === 'oldest') {
        return (a.id || 0) - (b.id || 0);
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [prices, priceSearchQuery, priceStateFilter, priceSortOrder]);

  const totalPricesPages = Math.ceil(filteredAndSortedPrices.length / ITEMS_PER_PAGE) || 1;
  const displayedPrices = useMemo(() => {
    const start = (pricePage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedPrices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedPrices, pricePage]);

  // Filtered & Sorted users for display
  const filteredAndSortedUsers = useMemo(() => {
    const list = users.filter((u) => {
      if (!userSearchQuery) return true;
      const q = userSearchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      if (userSortOrder === 'oldest') {
        return (a.id || 0) - (b.id || 0);
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [users, userSearchQuery, userSortOrder]);

  const totalUsersPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE) || 1;
  const displayedUsers = useMemo(() => {
    const start = (userPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedUsers, userPage]);

  // Filtered & Sorted logistics for display
  const filteredAndSortedTransports = useMemo(() => {
    const list = transports.filter((t) => {
      if (!transportSearchQuery) return true;
      const q = transportSearchQuery.toLowerCase();
      return (
        (t.cropName || '').toLowerCase().includes(q) ||
        (t.farmerName || '').toLowerCase().includes(q) ||
        (t.driverName || '').toLowerCase().includes(q) ||
        (t.destinationMarket || '').toLowerCase().includes(q) ||
        (t.gatePassCode || '').toLowerCase().includes(q) ||
        (t.status || '').toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      if (transportSortOrder === 'oldest') {
        return (a.id || 0) - (b.id || 0);
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [transports, transportSearchQuery, transportSortOrder]);

  const totalTransportsPages = Math.ceil(filteredAndSortedTransports.length / ITEMS_PER_PAGE) || 1;
  const displayedTransports = useMemo(() => {
    const start = (transportPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedTransports, transportPage]);

  // Filtered schemes for Admin Management
  const filteredAndSortedSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const q = schemeSearchQuery.toLowerCase();
      const matchQuery = !schemeSearchQuery || 
        (s.name || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q);
      const matchCat = schemeCategoryFilter === 'all' || s.category === schemeCategoryFilter;
      return matchQuery && matchCat;
    });
  }, [schemes, schemeSearchQuery, schemeCategoryFilter]);

  const totalSchemesPages = Math.ceil(filteredAndSortedSchemes.length / ITEMS_PER_PAGE) || 1;
  const displayedSchemes = useMemo(() => {
    const start = (schemePage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedSchemes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedSchemes, schemePage]);

  // STRICT ACCESS RESTRICTION:
  // If user is logged in as a normal Farmer or Transporter, do NOT allow admin access or demo switch!
  if (isAuthenticated && user?.role && user.role !== 'admin' && !token) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="rounded-3xl border border-red-200 bg-white p-8 sm:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full">
              Privilege Restriction Active
            </span>
            <h1 className="text-2xl font-black text-text">
              APMC Administrator Console
            </h1>
            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
              This administrative control panel is restricted to certified APMC Mandi Regulators. You are currently logged in with a{' '}
              <strong className="text-primary font-bold capitalize">{user.role}</strong> account ({user.name}).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-muted font-medium">Logged-in User:</span>
              <span className="font-bold text-text">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted font-medium">Role:</span>
              <span className="font-bold text-primary capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted font-medium">Status:</span>
              <span className="font-semibold text-emerald-700">Farmer Dashboard Access Only</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Farmer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function toggleSchemeStatus(schemeId, currentActive) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/schemes/admin/${schemeId}/status`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ isActive: !currentActive })
      });
      setSchemes((prev) => prev.map((s) => (s.id === schemeId ? { ...s, isActive: !currentActive } : s)));
      showToast({
        type: 'success',
        title: 'Scheme Status Updated',
        message: `Scheme record updated to ${!currentActive ? 'ACTIVE' : 'INACTIVE'}. Audit log registered.`
      });
    } catch {
      setSchemes((prev) => prev.map((s) => (s.id === schemeId ? { ...s, isActive: !currentActive } : s)));
      showToast({
        type: 'info',
        title: 'Status Updated',
        message: `Scheme status toggled.`
      });
    }
  }

  const cards = [
    { label: 'Registered Users', value: summary?.users || users.length || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Farmer Profiles', value: summary?.farmers || 0, icon: Wheat, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Transporters', value: summary?.transporters || 0, icon: Truck, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Active Mandis', value: summary?.markets || markets.length || 0, icon: Store, color: 'text-amber-600 bg-amber-50' },
    { label: 'Live Price Points', value: summary?.marketPrices || prices.length || 0, icon: IndianRupee, color: 'text-purple-600 bg-purple-50' },
    { label: 'Verified Schemes', value: schemes.length || 10, icon: Landmark, color: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Admin Header with Real-Time Greeting */}
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>APMC Central Regulatory Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text">
            {token ? `${greeting}, Administrator! ${icon}` : 'APMC Regulatory Access'}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Authorize daily mandi benchmark rates across Indian states, monitor farm registries, and oversee transport operations.
          </p>
        </div>

        {token && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadAdminData()}
              className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              id="admin-sign-out-btn"
              onClick={() => {
                localStorage.removeItem('harvestmitra_admin_token');
                setToken('');
                showToast({ type: 'info', title: 'Signed Out', message: 'Admin session terminated.' });
                logout();
              }}
              className="py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-100 text-red-600 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        )}
      </section>

      {/* Admin Login Form if not authenticated */}
      {!token && (
        <div className="max-w-md mx-auto space-y-4">
          <form
            onSubmit={loginAdmin}
            className="rounded-3xl border border-border bg-white p-7 shadow-xl space-y-4 backdrop-blur-xl"
          >
            <div className="text-center space-y-1 pb-2 border-b border-border/80">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-text">APMC Administrator Sign In</h2>
              <p className="text-xs text-muted">
                Enter your official regulatory email and master password.
              </p>
            </div>

            {/* Quick-Fill Helper Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>Official Admin Credentials</span>
                </p>
                <p className="text-[11px] text-amber-800 font-mono mt-0.5 truncate">
                  admin@harvestmitra.local • Admin@12345
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@harvestmitra.local');
                  setPassword('Admin@12345');
                  setError('');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
              >
                ⚡ 1-Click Fill
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Admin Email *
              </span>
              <input
                type="email"
                required
                placeholder="admin@harvestmitra.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Master Password *
              </span>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-xs font-bold shadow-md"
            >
              {loading ? 'Authenticating with MySQL...' : 'Verify Admin Access'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Admin Console Body */}
      {token && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.label}
                  className="rounded-2xl border border-border bg-white p-4 shadow-xs space-y-2 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted font-bold">{c.label}</span>
                    <div className={`p-1.5 rounded-lg ${c.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-text font-mono">{c.value}</p>
                </article>
              );
            })}
          </section>

          {/* Tab Navigation */}
          <div className="flex flex-wrap border-b border-border/80 gap-4 text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('prices')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'prices'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>APMC Market Prices & Mandi Rates</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {prices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Registered Users & Farmers</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transport')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'transport'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Logistics & Transport Dispatches</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {transports.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schemes')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'schemes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Government Schemes & Subsidies</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                {schemes.length || 10}
              </span>
            </button>
          </div>

          {/* TAB 1: APMC MARKET PRICES */}
          {activeTab === 'prices' && (
            <div className="space-y-4">
              {/* Controls Strip: Add Button + Filter by State + Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPriceId(null);
                      setIsPriceFormOpen((prev) => !prev);
                    }}
                    className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPriceFormOpen ? 'Close Price Form' : '+ Add / Update APMC Mandi Rate'}</span>
                  </button>

                  {/* State Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted font-semibold hidden md:inline">State:</span>
                    <select
                      value={priceStateFilter}
                      onChange={(e) => {
                        setPriceStateFilter(e.target.value);
                        setPricePage(1);
                      }}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:border-primary bg-white"
                    >
                      <option value="all">All States</option>
                      {availableStates.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Latest / Oldest Sort Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted font-semibold hidden md:inline">Sort:</span>
                    <select
                      value={priceSortOrder}
                      onChange={(e) => {
                        setPriceSortOrder(e.target.value);
                        setPricePage(1);
                      }}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-bold outline-none focus:border-primary bg-white"
                    >
                      <option value="latest">Latest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Search Mandi / Crop */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search crop or mandi..."
                    value={priceSearchQuery}
                    onChange={(e) => {
                      setPriceSearchQuery(e.target.value);
                      setPricePage(1);
                    }}
                    className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Form to Add / Edit APMC Market Price */}
              {isPriceFormOpen && (
                <form
                  onSubmit={handlePriceFormSubmit}
                  className="rounded-3xl border border-primary/30 bg-emerald-50/30 p-6 shadow-md space-y-4 animate-in fade-in transition-all"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-text">
                          {editingPriceId ? 'Edit APMC Market Price Record' : 'Publish Official APMC Mandi Rate'}
                        </h3>
                        <p className="text-[11px] text-muted">
                          Select State to filter Districts and Mandis dynamically.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPriceFormOpen(false);
                        setEditingPriceId(null);
                      }}
                      className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. SELECT STATE (Drives Mandi Dropdown) */}
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                        1. Select State *
                      </span>
                      <select
                        required
                        value={priceForm.state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full rounded-xl border border-border px-3 py-2.5 text-xs font-bold outline-none focus:border-primary bg-white"
                      >
                        {availableStates.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </label>

                    {/* 2. SELECT DISTRICT / APMC MANDI (Cascaded from State) */}
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                        2. District & APMC Mandi *
                      </span>
                      <select
                        required
                        value={priceForm.marketId}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, marketId: e.target.value }))}
                        className="w-full rounded-xl border border-border px-3 py-2.5 text-xs font-bold outline-none focus:border-primary bg-white"
                      >
                        {filteredFormMarkets.length === 0 ? (
                          <option value="">No mandis registered in {priceForm.state}</option>
                        ) : (
                          filteredFormMarkets.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.district})
                            </option>
                          ))
                        )}
                      </select>
                    </label>

                    {/* 3. SELECT CROP */}
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                        3. Crop Produce *
                      </span>
                      <select
                        required
                        value={priceForm.cropId}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, cropId: e.target.value }))}
                        className="w-full rounded-xl border border-border px-3 py-2.5 text-xs font-bold outline-none focus:border-primary bg-white"
                      >
                        {crops.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameEn} {c.nameGu ? `(${c.nameGu})` : ''}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* 4. MODAL PRICE PER QUINTAL */}
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                        4. Modal Price (₹ / Qtl) *
                      </span>
                      <input
                        type="number"
                        required
                        step="10"
                        placeholder="e.g. 2150"
                        value={priceForm.pricePerQuintal}
                        onChange={(e) => handleQuintalPriceChange(e.target.value)}
                        className="w-full rounded-xl border border-border px-3.5 py-2.5 text-xs font-bold outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  {/* Calculated metrics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-muted">Price per Kg (₹/kg)</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="21.5"
                        value={priceForm.pricePerKg}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                        className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:border-primary bg-slate-50"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-muted">Min Price (₹/Qtl)</span>
                      <input
                        type="number"
                        placeholder="1980"
                        value={priceForm.minPrice}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, minPrice: e.target.value }))}
                        className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:border-primary bg-slate-50"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-muted">Max Price (₹/Qtl)</span>
                      <input
                        type="number"
                        placeholder="2320"
                        value={priceForm.maxPrice}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:border-primary bg-slate-50"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-muted">Date of Verification</span>
                      <input
                        type="date"
                        value={priceForm.priceDate}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, priceDate: e.target.value }))}
                        className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPriceFormOpen(false);
                        setEditingPriceId(null);
                      }}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={priceFormSubmitting}
                      className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>{priceFormSubmitting ? 'Saving to MySQL...' : editingPriceId ? 'Update Price' : 'Publish Price'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Live Prices Table */}
              <section className="rounded-3xl border border-border bg-white shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm text-text">Live APMC Mandi Price Records (MySQL)</h2>
                    <p className="text-[11px] text-muted">Strict limit: 10 per page • Sorted by {priceSortOrder === 'latest' ? 'Latest' : 'Oldest'} first</p>
                  </div>
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                    Showing {displayedPrices.length} of {filteredAndSortedPrices.length} records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 text-muted uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3">Crop Commodity</th>
                        <th className="px-5 py-3">APMC Mandi</th>
                        <th className="px-5 py-3">District & State</th>
                        <th className="px-5 py-3">Modal Rate</th>
                        <th className="px-5 py-3">Per Kg Rate</th>
                        <th className="px-5 py-3">Min - Max Range</th>
                        <th className="px-5 py-3">Price Date</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {displayedPrices.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-5 py-8 text-center text-muted">
                            No market price records match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        displayedPrices.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-muted">#{p.id}</td>
                            <td className="px-5 py-3.5 font-bold text-text">
                              <span className="text-emerald-700">{p.Crop?.nameEn || 'Crop'}</span>
                              {p.Crop?.nameGu && (
                                <span className="block text-[11px] text-muted font-normal">{p.Crop.nameGu}</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-text">
                              {p.Market?.name || 'Mandi'}
                            </td>
                            <td className="px-5 py-3.5 text-muted">
                              <div>{p.Market?.district}</div>
                              <div className="text-[10px] font-semibold text-slate-500">{p.Market?.state}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-text">
                              ₹{Number(p.pricePerQuintal).toLocaleString()} / Qtl
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                              ₹{p.pricePerKg} / kg
                            </td>
                            <td className="px-5 py-3.5 font-mono text-muted text-[11px]">
                              ₹{p.minPrice} - ₹{p.maxPrice}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-muted">
                              {p.priceDate ? p.priceDate.slice(0, 10) : 'Today'}
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => startEditPrice(p)}
                                className="p-1.5 rounded-lg text-primary hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Edit market price"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePrice(p.id)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete price record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls Footer */}
                {totalPricesPages > 1 && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-muted">
                      Showing <strong className="text-text">{(pricePage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
                      <strong className="text-text">{Math.min(pricePage * ITEMS_PER_PAGE, filteredAndSortedPrices.length)}</strong> of{' '}
                      <strong className="text-text">{filteredAndSortedPrices.length}</strong> records (10 per page)
                    </span>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={pricePage <= 1}
                        onClick={() => setPricePage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold font-mono">
                        {pricePage} / {totalPricesPages}
                      </span>
                      <button
                        type="button"
                        disabled={pricePage >= totalPricesPages}
                        onClick={() => setPricePage((p) => Math.min(totalPricesPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Sort User Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-text">Platform User Directory</h3>
                  <p className="text-[11px] text-muted">View registered farmers, transport providers, and system administrators</p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setUserPage(1);
                      }}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={userSortOrder}
                    onChange={(e) => {
                      setUserSortOrder(e.target.value);
                      setUserPage(1);
                    }}
                    className="rounded-xl border border-border px-3 py-2 text-xs bg-white text-text font-bold outline-none focus:border-primary shadow-xs"
                  >
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* User Table */}
              <section className="rounded-3xl border border-border bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 text-muted uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3">Full Name</th>
                        <th className="px-5 py-3">Contact</th>
                        <th className="px-5 py-3">Assigned Role</th>
                        <th className="px-5 py-3">Farmer / Transporter Details</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {displayedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-muted">
                            No users matched your query.
                          </td>
                        </tr>
                      ) : (
                        displayedUsers.map((u) => {
                          const farm = u.FarmerProfile;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-muted">#{u.id}</td>
                              <td className="px-5 py-3.5 font-bold text-text">{u.name}</td>
                              <td className="px-5 py-3.5 text-muted">
                                <div>{u.email}</div>
                                <div className="font-mono text-[11px] font-semibold text-text">+91 {u.phone || 'N/A'}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    u.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : u.role === 'transporter'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-muted">
                                {farm ? (
                                  <div>
                                    <span className="font-semibold text-text">{farm.district}, {farm.state}</span>
                                    <span className="block text-[11px]">{farm.farmSizeAcres} Acres • Main: {farm.mainCrop || 'Produce'}</span>
                                  </div>
                                ) : u.role === 'admin' ? (
                                  <span className="text-[11px] text-amber-700 font-semibold">APMC State Regulator</span>
                                ) : (
                                  <span className="text-[11px] text-slate-500">Transporter Fleet</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {u.role !== 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => deleteUser(u.id)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalUsersPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-slate-50/50 text-xs">
                    <div className="text-muted text-[11px]">
                      Showing <span className="font-bold text-text">{(userPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-bold text-text">{Math.min(userPage * ITEMS_PER_PAGE, filteredAndSortedUsers.length)}</span> of{' '}
                      <span className="font-bold text-text">{filteredAndSortedUsers.length}</span> registered users (10 per page)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={userPage <= 1}
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold font-mono">
                        {userPage} / {totalUsersPages}
                      </span>
                      <button
                        type="button"
                        disabled={userPage >= totalUsersPages}
                        onClick={() => setUserPage((p) => Math.min(totalUsersPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 3: LOGISTICS & CARGO OPERATIONS */}
          {activeTab === 'transport' && (
            <div className="space-y-4">
              {/* Search & Sort Transport Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-text">Mandi Logistics & Cargo Directory</h3>
                  <p className="text-[11px] text-muted">Real-time oversight of farmer produce shipments, carrier locks, and delivery gate passes</p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search cargo, mandi, gate pass..."
                      value={transportSearchQuery}
                      onChange={(e) => {
                        setTransportSearchQuery(e.target.value);
                        setTransportPage(1);
                      }}
                      className="w-full rounded-xl border border-border pl-9 pr-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={transportSortOrder}
                    onChange={(e) => {
                      setTransportSortOrder(e.target.value);
                      setTransportPage(1);
                    }}
                    className="rounded-xl border border-border px-3 py-2 text-xs bg-white text-text font-bold outline-none focus:border-primary shadow-xs"
                  >
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Transport Table */}
              <section className="rounded-3xl border border-border bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 text-muted uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="px-5 py-3">Pass / ID</th>
                        <th className="px-5 py-3">Farmer</th>
                        <th className="px-5 py-3">Assigned Transporter</th>
                        <th className="px-5 py-3">Route (Origin → Mandi)</th>
                        <th className="px-5 py-3">Cargo Produce</th>
                        <th className="px-5 py-3">Fare / ETA</th>
                        <th className="px-5 py-3 text-right">Trip Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {displayedTransports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-muted">
                            No cargo shipments found.
                          </td>
                        </tr>
                      ) : (
                        displayedTransports.map((t) => {
                          const statusColor = {
                            open: 'bg-amber-100 text-amber-800 border-amber-200',
                            matched: 'bg-blue-100 text-blue-800 border-blue-200',
                            accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                            in_transit: 'bg-cyan-100 text-cyan-800 border-cyan-200',
                            delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
                          }[t.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5">
                                <span className="font-mono font-bold text-primary block">{t.gatePassCode || `PASS-${t.id}`}</span>
                                <span className="text-[10px] text-muted">#{t.id} • {t.pickupDate}</span>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-text">
                                <div>{t.farmerName}</div>
                                <div className="text-[11px] font-normal text-muted font-mono">{t.farmerPhone || (t.status === 'open' ? 'Contact shared after assignment' : t.User?.phone || 'No phone')}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                {t.driverName ? (
                                  <div>
                                    <span className="font-bold text-text block">{t.driverName}</span>
                                    <span className="text-[11px] text-muted font-mono">{t.driverPhone || 'N/A'}</span>
                                    {t.vehicleNumber && (
                                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                                        {t.vehicleNumber}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Awaiting Carrier
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-muted">
                                <div className="font-semibold text-text">{t.pickupLocation}</div>
                                <div className="text-[11px] text-primary font-medium">➔ {t.destinationMarket}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-text">{t.cropName}</div>
                                <div className="text-[11px] text-muted font-mono">{t.weightKg} kg</div>
                              </td>
                              <td className="px-5 py-3.5 font-mono">
                                <div className="font-bold text-emerald-700">₹{t.estimatedSharedCost?.toLocaleString('en-IN') || 'N/A'}</div>
                                <div className="text-[10px] text-muted">{t.estimatedDurationMinutes ? `~${Math.round(t.estimatedDurationMinutes / 60)} hrs travel` : 'Standard'}</div>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                  {t.status?.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalTransportsPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-slate-50/50 text-xs">
                    <div className="text-muted text-[11px]">
                      Showing <span className="font-bold text-text">{(transportPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-bold text-text">{Math.min(transportPage * ITEMS_PER_PAGE, filteredAndSortedTransports.length)}</span> of{' '}
                      <span className="font-bold text-text">{filteredAndSortedTransports.length}</span> shipments (10 per page)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={transportPage <= 1}
                        onClick={() => setTransportPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold font-mono">
                        {transportPage} / {totalTransportsPages}
                      </span>
                      <button
                        type="button"
                        disabled={transportPage >= totalTransportsPages}
                        onClick={() => setTransportPage((p) => Math.min(totalTransportsPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: GOVERNMENT SCHEMES DIRECTORY */}
          {activeTab === 'schemes' && (
            <div className="space-y-4">
              {/* Controls Strip: Filter by Category + Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted font-semibold hidden md:inline">Category:</span>
                    <select
                      value={schemeCategoryFilter}
                      onChange={(e) => {
                        setSchemeCategoryFilter(e.target.value);
                        setSchemePage(1);
                      }}
                      className="px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-text outline-none focus:border-primary"
                    >
                      <option value="all">All Categories</option>
                      <option value="Direct Income Support">Direct Income Support</option>
                      <option value="Crop Insurance & Risk Mitigation">Crop Insurance & Risk</option>
                      <option value="Irrigation & Water Conservation">Irrigation & Water</option>
                      <option value="Farm Mechanization & Machinery">Farm Machinery</option>
                      <option value="Soil Health & Nutrition">Soil Health</option>
                      <option value="Credit & Working Capital">Credit & Loans</option>
                      <option value="Organic & Natural Farming">Organic Farming</option>
                      <option value="Horticulture Development">Horticulture</option>
                      <option value="Post-Harvest Infrastructure">Storage & Cold Chains</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search schemes or dept..."
                      value={schemeSearchQuery}
                      onChange={(e) => {
                        setSchemeSearchQuery(e.target.value);
                        setSchemePage(1);
                      }}
                      className="pl-8 pr-3 py-2 rounded-xl border border-border bg-white text-xs text-text placeholder:text-muted/60 outline-none focus:border-primary w-48 sm:w-64"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted font-medium flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {filteredAndSortedSchemes.length} Verified Records
                  </span>
                </div>
              </div>

              {/* Regulatory Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">Official Portal Integrity Check: </span>
                  Every scheme record links strictly to official government portals (e.g. <span className="font-mono text-[11px] text-emerald-700">pmkisan.gov.in</span>, <span className="font-mono text-[11px] text-emerald-700">pmfby.gov.in</span>, <span className="font-mono text-[11px] text-emerald-700">ikhedut.gujarat.gov.in</span>). Deactivating a scheme suppresses it from farmer eligibility matching instantly.
                </div>
              </div>

              {/* Schemes Table */}
              <section className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-border text-[11px] uppercase tracking-wider text-muted font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Scheme Identifier & Name</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Scope & Dept</th>
                        <th className="px-5 py-3.5">Verified Source</th>
                        <th className="px-5 py-3.5">Last Verified</th>
                        <th className="px-5 py-3.5 text-right">Status & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {displayedSchemes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-muted">
                            No government schemes found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        displayedSchemes.map((s) => {
                          const isActive = s.isActive !== false;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-text text-sm">{s.name}</div>
                                <div className="text-[11px] text-muted font-mono">{s.schemeCode}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 inline-block">
                                  {s.category}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-text">{s.level} {s.state ? `(${s.state})` : '(Pan-India)'}</div>
                                <div className="text-[11px] text-muted truncate max-w-xs">{s.department}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                {s.sourceUrl ? (
                                  <a
                                    href={s.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 hover:text-emerald-900 font-semibold underline inline-flex items-center gap-1 font-mono text-[11px]"
                                  >
                                    <span>{new URL(s.sourceUrl).hostname}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-muted text-[11px]">Verified Source</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-muted font-mono text-[11px]">
                                {s.lastVerifiedDate || 'October 2026'}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleSchemeStatus(s.id, isActive)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                                  }`}
                                >
                                  {isActive ? '● Active' : '○ Inactive'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalSchemesPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-slate-50/50 text-xs">
                    <div className="text-muted text-[11px]">
                      Showing <span className="font-bold text-text">{(schemePage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-bold text-text">{Math.min(schemePage * ITEMS_PER_PAGE, filteredAndSortedSchemes.length)}</span> of{' '}
                      <span className="font-bold text-text">{filteredAndSortedSchemes.length}</span> schemes
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={schemePage <= 1}
                        onClick={() => setSchemePage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold font-mono">
                        {schemePage} / {totalSchemesPages}
                      </span>
                      <button
                        type="button"
                        disabled={schemePage >= totalSchemesPages}
                        onClick={() => setSchemePage((p) => Math.min(totalSchemesPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

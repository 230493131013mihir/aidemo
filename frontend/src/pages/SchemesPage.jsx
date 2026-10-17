import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Search, 
  Filter, 
  Sparkles, 
  Bookmark, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  fetchSchemes, 
  matchFarmerSchemes, 
  fetchSavedSchemes, 
  saveScheme, 
  removeSavedScheme 
} from '../services/schemeApi';
import SchemeCard from '../components/schemes/SchemeCard';
import SchemeFinderWizard from '../components/schemes/SchemeFinderWizard';
import SchemeDetailModal from '../components/schemes/SchemeDetailModal';
import VoiceSearchButton from '../components/common/VoiceSearchButton';

const CATEGORIES = [
  { id: 'all', label: 'All Schemes' },
  { id: 'income_support', label: 'Income Support' },
  { id: 'crop_insurance', label: 'Crop Insurance' },
  { id: 'irrigation_water', label: 'Drip & Irrigation' },
  { id: 'machinery_equipment', label: 'Farm Machinery' },
  { id: 'fertilizer_soil', label: 'Soil Health' },
  { id: 'credit_interest', label: 'KCC Loans' },
  { id: 'organic_farming', label: 'Organic Farming' },
  { id: 'horticulture', label: 'Horticulture' },
  { id: 'storage_logistics', label: 'Storage & Cold Chain' },
];

export default function SchemesPage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [schemes, setSchemes] = useState([]);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Modals & Match Engine
  const [showWizard, setShowWizard] = useState(false);
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState(null);
  const [isMatchActive, setIsMatchActive] = useState(false);

  // Load schemes from backend
  async function loadSchemes(query = search) {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSchemes({
        category: selectedCategory,
        state: selectedState,
        search: query
      });
      setSchemes(res.data || []);
      setIsMatchActive(false);
    } catch (err) {
      console.error('Error loading schemes:', err.message);
      setError('Unable to connect to scheme database. Showing verified offline schemes.');
    } finally {
      setLoading(false);
    }
  }

  // Load saved bookmarks if user logged in, or local bookmarks if guest
  async function loadSaved() {
    if (isAuthenticated) {
      try {
        const saved = await fetchSavedSchemes();
        setSavedSchemes(saved || []);
      } catch (e) {
        // Safe fallback
      }
    } else {
      try {
        const localIds = JSON.parse(localStorage.getItem('harvestmitra_guest_saved') || '[]');
        const localMatched = schemes.filter(s => localIds.includes(s.id)).map(s => ({ scheme: s, notes: 'Saved in Guest Session' }));
        setSavedSchemes(localMatched);
      } catch (e) {
        // Ignore
      }
    }
  }

  useEffect(() => {
    loadSchemes();
  }, [selectedCategory, selectedState]);

  useEffect(() => {
    loadSaved();
  }, [isAuthenticated, schemes]);

  // Handle personalized matching
  async function handleWizardComplete(answers) {
    setLoading(true);
    setShowWizard(false);
    try {
      const matched = await matchFarmerSchemes(answers);
      setSchemes(matched || []);
      setIsMatchActive(true);
      showToast({
        type: 'success',
        title: '🎯 Matching Complete!',
        message: `Evaluated ${matched.length} verified government schemes against your farm criteria.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Matching Error',
        message: err.message || 'Unable to compute match. Showing directory.'
      });
      loadSchemes();
    } finally {
      setLoading(false);
    }
  }

  // Toggle bookmark / save
  async function handleToggleSave(schemeId) {
    if (!isAuthenticated) {
      const localIds = JSON.parse(localStorage.getItem('harvestmitra_guest_saved') || '[]');
      const exists = localIds.includes(schemeId);
      const updated = exists ? localIds.filter(id => id !== schemeId) : [...localIds, schemeId];
      localStorage.setItem('harvestmitra_guest_saved', JSON.stringify(updated));
      const targetScheme = schemes.find(s => s.id === schemeId);
      if (exists) {
        setSavedSchemes(prev => prev.filter(s => s.scheme?.id !== schemeId));
        showToast({
          type: 'info',
          title: 'Removed from Bookmarks',
          message: 'Scheme removed from your guest session.'
        });
      } else if (targetScheme) {
        setSavedSchemes(prev => [...prev, { scheme: targetScheme, notes: 'Saved in Guest Session' }]);
        showToast({
          type: 'success',
          title: 'Saved to Bookmarks!',
          message: 'Scheme saved locally in your guest session. Sign in anytime to sync permanently.'
        });
      }
      return;
    }

    const isAlreadySaved = savedSchemes.some(s => s.scheme.id === schemeId);
    try {
      if (isAlreadySaved) {
        await removeSavedScheme(schemeId);
        setSavedSchemes(prev => prev.filter(s => s.scheme.id !== schemeId));
        showToast({
          type: 'info',
          title: 'Removed from Saved',
          message: 'Scheme removed from your saved list.'
        });
      } else {
        await saveScheme(schemeId);
        await loadSaved();
        showToast({
          type: 'celebrate',
          title: '📌 Scheme Saved!',
          message: 'Added to your saved schemes. Access your document checklist anytime.'
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to update saved schemes.'
      });
    }
  }

  // Filter schemes if showSavedOnly is on
  const displayedSchemes = showSavedOnly
    ? schemes.filter(s => savedSchemes.some(saved => saved.scheme.id === s.id))
    : schemes;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Header Hero Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 text-white shadow-xl overflow-hidden border border-emerald-800/40">
        {/* Subtle background graphics */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Landmark className="w-3.5 h-3.5 text-amber-300" />
              <span>Kisan Sahayata Module</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Verified Official Portals Only</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Government Scheme Finder for Farmers
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Discover verified Central, Gujarat (i-Khedut), and Maharashtra agricultural assistance schemes. Check deterministic eligibility, track your required document checklist, and connect directly to official government portals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-300 via-emerald-300 to-emerald-200 hover:scale-105 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-950" />
              <span>Personalized Farm Scheme Matcher</span>
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border backdrop-blur-md transition-all ${
                  showSavedOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Schemes ({savedSchemes.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Personalized Wizard Form (When open) */}
      {showWizard && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <SchemeFinderWizard
            initialData={{
              state: user?.FarmerProfile?.state || 'Gujarat',
              district: user?.FarmerProfile?.district || 'Surat',
              farmSizeAcres: user?.FarmerProfile?.farmSizeAcres || '3.5',
              crops: user?.FarmerProfile?.mainCrop ? user.FarmerProfile.mainCrop.split(',').map(s => s.trim()) : ['Tomato']
            }}
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      )}

      {/* 3. Search and Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="schemes-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadSchemes(search)}
                placeholder="Search schemes by name, department, or keyword (e.g. PM-KISAN, Drip, Tractor)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 bg-slate-50/50 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <VoiceSearchButton
              id="schemes-voice-search-btn"
              onResult={(transcript) => {
                setSearch(transcript);
                loadSchemes(transcript);
              }}
            />
          </div>

          {/* State Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-300 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Applicability: All India & All States</option>
              <option value="Gujarat">Gujarat (ગુજરાત - i-Khedut)</option>
              <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
            </select>
          </div>

          {/* Search Action / Reset Button */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={loadSchemes}
              className="w-full py-2.5 px-4 rounded-2xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Personalized Match Notice */}
      {isMatchActive && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Personalized Match Results Active:</strong> Showing schemes evaluated against your farm landholding, crops, and location.
            </span>
          </div>
          <button
            type="button"
            onClick={loadSchemes}
            className="text-xs font-bold underline text-emerald-800 hover:text-emerald-950 self-start sm:self-auto"
          >
            Clear Personalized Filter (Show All)
          </button>
        </div>
      )}

      {/* 5. Schemes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            <span>
              {showSavedOnly ? 'My Saved Schemes' : isMatchActive ? 'Matching Schemes for Your Farm' : 'Verified Government Schemes'}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {displayedSchemes.length} Available
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : displayedSchemes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Landmark className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No schemes matched your criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try selecting "All Schemes", broadening your search keyword, or resetting the personalized matcher.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedState('all');
                setSearch('');
                setShowSavedOnly(false);
                loadSchemes();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedSchemes.map(scheme => {
              const isSaved = savedSchemes.some(s => s.scheme.id === scheme.id);
              return (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  isSaved={isSaved}
                  onToggleSave={handleToggleSave}
                  onOpenDetails={s => setSelectedSchemeForModal(s)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Official Government Starting Points (Requirement 5) */}
      <div className="rounded-3xl p-6 bg-slate-50 border border-slate-200 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Official Government Agricultural Portals</span>
          </h3>
          <p className="text-xs text-slate-500">
            HarvestMitra AI links directly to authorized Central and State government portals. Never enter passwords or personal data on unverified websites.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              name: 'myScheme National Portal',
              domain: 'myscheme.gov.in',
              url: 'https://www.myscheme.gov.in/',
              desc: 'Official platform across all central & state ministries.'
            },
            {
              name: 'PM-KISAN Samman Nidhi',
              domain: 'pmkisan.gov.in',
              url: 'https://pmkisan.gov.in/',
              desc: 'Direct DBT income transfer portal for landholding farmers.'
            },
            {
              name: 'PM Fasal Bima Yojana (PMFBY)',
              domain: 'pmfby.gov.in',
              url: 'https://pmfby.gov.in/',
              desc: 'National crop insurance policy & claims registration.'
            },
            {
              name: 'Gujarat i-Khedut Portal',
              domain: 'ikhedut.gujarat.gov.in',
              url: 'https://ikhedut.gujarat.gov.in/',
              desc: 'Gujarat Department of Agriculture single-window scheme portal.'
            }
          ].map(portal => (
            <a
              key={portal.domain}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {portal.domain}
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {portal.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {portal.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-1">
                <span>Visit Portal</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 7. Document Checklist & Details Modal */}
      {selectedSchemeForModal && (
        <SchemeDetailModal
          scheme={selectedSchemeForModal}
          isAuthenticated={isAuthenticated}
          onClose={() => setSelectedSchemeForModal(null)}
        />
      )}
    </div>
  );
}

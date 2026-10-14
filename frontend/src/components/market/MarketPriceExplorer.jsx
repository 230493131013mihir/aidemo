/**
 * MarketPriceExplorer.jsx
 * Mandi Market Price Search, Filter, and Comparison UI
 * Supports English, Hindi, Gujarati, Marathi
 * HarvestMitra AI - ISSUE-11
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Calculator,
  X,
  Layers
} from 'lucide-react';
import {
  fetchMarkets,
  fetchCrops,
  fetchMarketPrices,
  compareMarkets
} from '../../services/marketApiService';

const I18N = {
  en: {
    title: 'Market Price Explorer',
    subtitle: 'Transparent Mandi commodity rates across Gujarat & Maharashtra',
    searchPlaceholder: 'Search crop, mandi, or district...',
    allCrops: 'All Crops',
    allDistricts: 'All Districts',
    allMarkets: 'All Mandis',
    unitKg: '₹ / kg',
    unitQuintal: '₹ / quintal',
    statusAll: 'All Sources',
    statusDemo: 'Demo Data',
    statusLive: 'Live Data',
    lastUpdated: 'Updated:',
    minMax: 'Min / Max:',
    modalRate: 'Modal Rate:',
    compareBtn: 'Compare Mandis',
    simulatorBtn: 'Use in Simulator',
    loading: 'Loading market prices...',
    emptyTitle: 'No Mandi Prices Found',
    emptyDesc: 'Try adjusting your crop or district filters to view available rates.',
    errorTitle: 'Unable to Load Market Prices',
    comparisonTitle: 'Mandi Price Comparison',
    priceSpread: 'Price Difference:',
    closeModal: 'Close'
  },
  hi: {
    title: 'मंडी भाव एक्सप्लोरर',
    subtitle: 'गुजरात और महाराष्ट्र की प्रमुख मंडियों के पारदर्शी भाव',
    searchPlaceholder: 'फसल, मंडी, या जिला खोजें...',
    allCrops: 'सभी फसलें',
    allDistricts: 'सभी जिले',
    allMarkets: 'सभी मंडियां',
    unitKg: '₹ / किलो',
    unitQuintal: '₹ / क्विंटल',
    statusAll: 'सभी स्रोत',
    statusDemo: 'डेमो डेटा',
    statusLive: 'लाइव डेटा',
    lastUpdated: 'अपडेट:',
    minMax: 'न्यूनतम / अधिकतम:',
    modalRate: 'मॉडल भाव:',
    compareBtn: 'मंडियों की तुलना करें',
    simulatorBtn: 'सिम्युलेटर में उपयोग करें',
    loading: 'मंडी भाव लोड हो रहे हैं...',
    emptyTitle: 'कोई मंडी भाव नहीं मिला',
    emptyDesc: 'उपलब्ध दरें देखने के लिए फसल या जिले का फ़िल्टर बदलें।',
    errorTitle: 'मंडी भाव लोड करने में असमर्थ',
    comparisonTitle: 'मंडी भाव तुलना',
    priceSpread: 'भाव का अंतर:',
    closeModal: 'बंद करें'
  },
  gu: {
    title: 'મંડી બજાર ભાવ એક્સપ્લોરર',
    subtitle: 'ગુજરાત અને મહારાષ્ટ્રની વિવિધ એપીએમસી મંડીઓના ચકાસાયેલ ભાવ',
    searchPlaceholder: 'પાક, મંડી અથવા જિલ્લો શોધો...',
    allCrops: 'બધા પાક',
    allDistricts: 'બધા જિલ્લા',
    allMarkets: 'બધી મંડીઓ',
    unitKg: '₹ / કિલો',
    unitQuintal: '₹ / ક્વિન્ટલ',
    statusAll: 'બધા સ્ત્રોત',
    statusDemo: 'ડેમો ડેટા',
    statusLive: 'લાઈવ ડેટા',
    lastUpdated: 'અપડેટ:',
    minMax: 'ઓછામાં ઓછો / મહત્તમ:',
    modalRate: 'મોડલ દર:',
    compareBtn: 'મંડીઓની સરખામણી',
    simulatorBtn: 'સિમ્યુલેટરમાં વાપરો',
    loading: 'મંડી ભાવ લોડ થઈ રહ્યા છે...',
    emptyTitle: 'કોઈ મંડી ભાવ મળ્યા નથી',
    emptyDesc: 'ઉપલબ્ધ માહિતી જોવા માટે પાક અથવા જિલ્લાના ફિલ્ટર બદલો.',
    errorTitle: 'મંડી ભાવ લોડ કરવામાં અસમર્થ',
    comparisonTitle: 'મંડી ભાવ સરખામણી',
    priceSpread: 'ભાવ તફાવત:',
    closeModal: 'બંધ કરો'
  },
  mr: {
    title: 'बाजार भाव एक्सप्लोरर',
    subtitle: 'गुजरात आणि महाराष्ट्रातील प्रमुख कृषी उत्पन्न बाजार समित्यांचे दर',
    searchPlaceholder: 'पीक, बाजार समिती किंवा जिल्हा शोधा...',
    allCrops: 'सर्व पिके',
    allDistricts: 'सर्व जिल्हे',
    allMarkets: 'सर्व बाजार समित्या',
    unitKg: '₹ / किलो',
    unitQuintal: '₹ / क्विंटल',
    statusAll: 'सर्व स्रोत',
    statusDemo: 'डेमो डेटा',
    statusLive: 'थेट डेटा',
    lastUpdated: 'अपडेट:',
    minMax: 'किमान / कमाल:',
    modalRate: 'सरासरी दर:',
    compareBtn: 'बाजार भाव तुलना',
    simulatorBtn: 'सिम्युलेटरमध्ये वापरा',
    loading: 'बाजार भाव लोड होत आहेत...',
    emptyTitle: 'कोणतेही बाजार भाव आढळले नाहीत',
    emptyDesc: 'उपलब्ध दर पाहण्यासाठी पीक किंवा जिल्ह्याचे फिल्टर बदला.',
    errorTitle: 'बाजार भाव लोड करता आले नाहीत',
    comparisonTitle: 'बाजार भाव तुलना विश्लेषण',
    priceSpread: 'दरांमधील फरक:',
    closeModal: 'बंद करा'
  }
};

export default function MarketPriceExplorer({
  selectedLanguage = 'en',
  onSelectMarketForSimulator = null
}) {
  const t = I18N[selectedLanguage] || I18N.en;

  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [priceUnit, setPriceUnit] = useState('kg'); // 'kg' or 'quintal'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'sample_demo', 'verified_live'

  // Comparison State
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        setError(null);
        const [cropsData, marketsData, pricesData] = await Promise.all([
          fetchCrops(),
          fetchMarkets(),
          fetchMarketPrices()
        ]);
        setCrops(cropsData);
        setMarkets(marketsData);
        setPrices(pricesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Filter Trigger
  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      const filtered = await fetchMarketPrices({
        crop: selectedCrop || searchQuery,
        district: selectedDistrict,
        market: selectedMarket,
        data_type: statusFilter !== 'all' ? statusFilter : undefined
      });
      setPrices(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleApplyFilters();
  }, [selectedCrop, selectedDistrict, selectedMarket, statusFilter]);

  // Handle Search Input Debounce or Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleApplyFilters();
  };

  // Compare Prices Flow
  const handleOpenComparison = async (cropName = 'Tomato') => {
    try {
      setComparisonLoading(true);
      setShowComparisonModal(true);
      const data = await compareMarkets(cropName);
      setComparisonData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setComparisonLoading(false);
    }
  };

  // Districts list derived from markets
  const districts = Array.from(new Set(markets.map(m => m.district))).sort();

  return (
    <div className="bg-stone-50 border border-emerald-200/80 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full font-sans">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/50 flex items-center justify-center text-lg">
              📈
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {t.title}
            </h2>
          </div>
          <p className="text-xs text-emerald-200/80 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Unit and Compare Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Unit Toggle: ₹/kg vs ₹/quintal */}
          <div className="flex items-center bg-emerald-950/60 p-0.5 rounded-lg border border-emerald-700/50 text-xs">
            <button
              type="button"
              onClick={() => setPriceUnit('kg')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                priceUnit === 'kg'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              {t.unitKg}
            </button>
            <button
              type="button"
              onClick={() => setPriceUnit('quintal')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                priceUnit === 'quintal'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              {t.unitQuintal}
            </button>
          </div>

          {/* Quick Compare Trigger */}
          <button
            type="button"
            onClick={() => handleOpenComparison(selectedCrop || 'Tomato')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{t.compareBtn}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3 sm:p-4 bg-white border-b border-emerald-100 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </form>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Crop Filter */}
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="">{t.allCrops}</option>
            {crops.map((c) => {
              const langName = selectedLanguage === 'gu' ? c.name_gu : selectedLanguage === 'hi' ? c.name_hi : selectedLanguage === 'mr' ? c.name_mr : c.name;
              return (
                <option key={c.id} value={c.name}>
                  {langName} ({c.name})
                </option>
              );
            })}
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="">{t.allDistricts}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Market Filter */}
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="">{t.allMarkets}</option>
            {markets.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 border border-emerald-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="all">{t.statusAll}</option>
            <option value="sample_demo">{t.statusDemo}</option>
            <option value="verified_live">{t.statusLive}</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-emerald-800 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm font-semibold">{t.loading}</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-bold text-sm">{t.errorTitle}</h3>
            <p className="text-xs mt-1 text-red-600">{error}</p>
          </div>
        ) : prices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-stone-500 p-6 text-center">
            <Building2 className="w-12 h-12 text-stone-300 mb-2" />
            <h3 className="font-bold text-sm text-stone-700">{t.emptyTitle}</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">{t.emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {prices.map((item) => {
              const displayPrice = priceUnit === 'kg' ? item.price_per_kg : item.price_per_quintal;
              const minP = priceUnit === 'kg' ? item.min_price : Math.round(item.min_price * 100);
              const maxP = priceUnit === 'kg' ? item.max_price : Math.round(item.max_price * 100);
              const isDemo = item.dataStatus === 'DEMO';

              return (
                <div
                  key={item.id}
                  className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Top: Crop Name & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>{item.crop_name}</span>
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-medium text-gray-700">{item.market_name}</span>
                          <span>•</span>
                          <span>{item.district}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          isDemo
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                        title={item.statusNotice}
                      >
                        {item.dataStatus} DATA
                      </span>
                    </div>

                    {/* Price Display */}
                    <div className="my-3.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-100/80 flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-extrabold text-emerald-900 tracking-tight">
                          ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 ml-1">
                          / {priceUnit}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-gray-500">
                        <span className="block">{t.minMax}</span>
                        <span className="font-semibold text-gray-700">
                          ₹{minP} - ₹{maxP}
                        </span>
                      </div>
                    </div>

                    {/* Demo Warning if applicable */}
                    {isDemo && (
                      <div className="text-[10px] text-amber-700/90 italic flex items-center gap-1 mb-2 bg-amber-50/50 p-1.5 rounded">
                        <span>ℹ️</span>
                        <span>Fictional demonstration data for testing.</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{t.lastUpdated} {item.last_updated ? item.last_updated.split('T')[0] : 'Today'}</span>
                    </div>

                    {onSelectMarketForSimulator && (
                      <button
                        type="button"
                        onClick={() => onSelectMarketForSimulator(item)}
                        className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold hover:underline"
                        title={t.simulatorBtn}
                      >
                        <Calculator className="w-3 h-3" />
                        <span>{t.simulatorBtn}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-emerald-200 animate-fadeIn max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-emerald-950">
                  {t.comparisonTitle}: {comparisonData?.crop || selectedCrop || 'Tomato'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {comparisonLoading ? (
              <div className="py-12 text-center text-sm text-emerald-700 font-medium">
                Loading comparative market data...
              </div>
            ) : comparisonData ? (
              <div className="mt-4 space-y-4">
                {/* Comparison metric summary banner */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">{t.priceSpread}</span>
                    <span className="block text-xl font-extrabold text-emerald-950">
                      ₹{comparisonData.priceDifferencePerKg} / kg
                    </span>
                  </div>
                  <div className="text-right text-xs text-emerald-800">
                    <div>Highest: <strong className="text-emerald-900">{comparisonData.highestMarket?.name}</strong> (₹{comparisonData.highestMarket?.pricePerKg}/kg)</div>
                    <div>Lowest: <strong className="text-emerald-900">{comparisonData.lowestMarket?.name}</strong> (₹{comparisonData.lowestMarket?.pricePerKg}/kg)</div>
                  </div>
                </div>

                {/* Mandi comparison cards */}
                <div className="space-y-2">
                  {comparisonData.comparisons.map((c) => (
                    <div
                      key={c.marketId}
                      className="p-3 rounded-xl border border-gray-100 hover:border-emerald-200 bg-stone-50/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{c.marketName}</div>
                        <div className="text-xs text-gray-500">{c.district}, {c.state}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-extrabold text-emerald-900">₹{c.pricePerKg}/kg</div>
                        <div className="text-[11px] text-gray-400">₹{c.pricePerQuintal}/quintal</div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-gray-400 italic">
                  Note: Price comparison is factual. Transportation and packaging expenses should be factored into net revenue via the Harvest Simulator.
                </p>
              </div>
            ) : null}

            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
              >
                {t.closeModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

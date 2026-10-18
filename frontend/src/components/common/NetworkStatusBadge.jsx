import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Database, Info, X } from 'lucide-react';

export default function NetworkStatusBadge({ className = '', inline = false }) {
  // Listen to browser network state
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
      ? navigator.onLine 
      : true
  );

  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => 
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeOnline = isOnline && !simulatedOffline;

  const toggleSimulate = (e) => {
    e.stopPropagation();
    setSimulatedOffline((prev) => !prev);
  };

  const pillText = activeOnline ? '🟢 Live APMC Sync' : '🟠 Offline Cached APMC Mode';

  // Base pill component
  return (
    <div 
      className={
        inline
          ? `relative inline-block print:hidden ${className}`
          : `fixed bottom-5 left-5 z-40 print:hidden ${className}`
      }
      id="network-status-badge-container"
    >
      {/* Expanded Status Flyout */}
      {showDetails && (
        <div 
          className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl p-3.5 space-y-2.5 text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="region"
          aria-label="Network telemetry details"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Agritech Cache Telemetry
            </span>
            <button 
              type="button" 
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              aria-label="Close telemetry info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">APMC Connection:</span>
              <span className={`font-bold flex items-center gap-1 ${activeOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                {activeOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {activeOnline ? 'Direct Cloud Sync' : 'Local APMC Snapshot'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Local Mandi Cache:</span>
              <span className="font-semibold text-slate-700">Surat, Pune, Mumbai (Active)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last Rate Sync:</span>
              <span className="font-mono text-slate-600">{lastSyncTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Offline Simulation:</span>
              <span className={`font-semibold ${simulatedOffline ? 'text-amber-600' : 'text-slate-400'}`}>
                {simulatedOffline ? 'Active (Manual Test)' : 'Auto-detect'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSimulate}
              id="toggle-offline-simulation-btn"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                simulatedOffline
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {simulatedOffline ? 'Disable Offline Test' : 'Test Offline APMC Mode'}
            </button>

            <span className="text-[10px] text-slate-400">HarvestMitra Core</span>
          </div>
        </div>
      )}

      {/* Main Floating Pill Badge */}
      <button
        type="button"
        id="network-status-badge"
        onClick={() => setShowDetails((prev) => !prev)}
        className={`group flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-[1.03] cursor-pointer ${
          activeOnline
            ? 'bg-white/90 border-emerald-300 text-emerald-900 shadow-emerald-950/10 hover:border-emerald-400'
            : 'bg-white/95 border-amber-400 text-amber-900 shadow-amber-950/15 hover:border-amber-500 ring-2 ring-amber-400/20'
        }`}
        role="status"
        aria-live="polite"
        title={activeOnline ? 'Live APMC connection active' : 'Running on cached offline APMC rates'}
      >
        {/* Animated Pulse Dot */}
        <span className="relative flex h-2.5 w-2.5">
          <span 
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              activeOnline ? 'bg-emerald-400' : 'bg-amber-500'
            }`}
          />
          <span 
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              activeOnline ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          />
        </span>

        {/* Text Pill content: '🟢 Live APMC Sync' or '🟠 Offline Cached APMC Mode' */}
        <span className="text-xs font-black tracking-tight flex items-center gap-1.5">
          <span>{pillText}</span>
        </span>

        {/* Subtle indicator for details */}
        <Info className={`w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ${
          activeOnline ? 'text-emerald-700' : 'text-amber-700'
        }`} />
      </button>
    </div>
  );
}

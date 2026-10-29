import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Calendar, 
  Truck, 
  Scale, 
  User, 
  Lock, 
  Printer, 
  Share2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Building2,
  RefreshCw,
  Phone
} from 'lucide-react';
import { getApiBaseUrl } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function VerifyGatePassPage() {
  const { code: paramCode } = useParams();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || searchParams.get('passId') || searchParams.get('passCode');
  const code = (paramCode || queryCode || '').trim();

  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [passData, setPassData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  const API_BASE_URL = getApiBaseUrl();

  async function fetchVerification() {
    if (!code) {
      setErrorMsg('No gate pass token or code provided in the verification URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/transport/gatepass/verify/${encodeURIComponent(code)}`, {
        headers
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Gate pass not found or invalid.');
        setPassData(null);
      } else {
        setPassData(json.data || json);
      }
    } catch (err) {
      console.error('Gate pass verification error:', err);
      setErrorMsg('Network error connecting to APMC Gate Pass verification service. Please try again.');
      setPassData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVerification();
  }, [code, token]);

  async function handleOperatorCheckin() {
    if (!token) {
      showToast({ type: 'error', title: 'Login Required', message: 'Mandi Official authentication required to record gate entry.' });
      return;
    }

    const passId = passData?.passId || code;
    setCheckingIn(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/transport/gatepass/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gatePassCode: passId,
          checkInNotes: `Verified and entry logged via QR Gate Scanner by ${user?.name || 'Mandi Official'}`
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to record gate arrival');
      }

      setCheckInSuccess(true);
      showToast({
        type: 'success',
        title: '✅ Gate Entry Recorded',
        message: json.message || `Consignment marked arrived for ${passId}`
      });
      fetchVerification();
    } catch (err) {
      showToast({ type: 'error', title: 'Check-in Error', message: err.message });
    } finally {
      setCheckingIn(false);
    }
  }

  function handleCopyPassId() {
    const textToCopy = passData?.passId || code;
    navigator.clipboard.writeText(textToCopy);
    showToast({ type: 'success', title: 'Copied', message: 'Gate pass ID copied to clipboard.' });
  }

  function handleShare() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'HarvestMitra APMC Mandi Digital Gate Pass',
        text: `Official APMC Gate Pass: ${passData?.passId || code}`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast({ type: 'success', title: 'Link Copied', message: 'Verification link copied to clipboard.' });
    }
  }

  const status = passData?.verificationStatus || passData?.status || (errorMsg ? 'INVALID' : 'UNKNOWN');

  // Status visual configurations
  const getStatusConfig = () => {
    switch (status) {
      case 'VALID':
        return {
          title: 'VALID DIGITAL TRANSIT PASS',
          subtitle: 'Authorized for APMC Gate Entry & Weighbridge Clearance',
          badgeText: 'VALID & ACTIVE',
          bgColor: 'bg-emerald-600',
          textColor: 'text-emerald-950',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          border: 'border-emerald-300'
        };
      case 'USED':
        return {
          title: 'GATE PASS ALREADY USED',
          subtitle: 'Arrival and gate entry previously logged at destination APMC',
          badgeText: 'USED / ARRIVED',
          bgColor: 'bg-blue-600',
          textColor: 'text-blue-950',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: CheckCircle2,
          border: 'border-blue-300'
        };
      case 'PENDING':
        return {
          title: 'TRANSIT PERMIT PENDING',
          subtitle: 'Awaiting driver assignment or transporter confirmation',
          badgeText: 'PENDING ASSIGNMENT',
          bgColor: 'bg-amber-600',
          textColor: 'text-amber-950',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
          border: 'border-amber-300'
        };
      case 'EXPIRED':
        return {
          title: 'GATE PASS EXPIRED',
          subtitle: 'Validity transit window has elapsed. Mandi re-issue required',
          badgeText: 'EXPIRED',
          bgColor: 'bg-slate-700',
          textColor: 'text-slate-900',
          badgeBg: 'bg-slate-200 text-slate-800 border-slate-400',
          icon: AlertTriangle,
          border: 'border-slate-300'
        };
      case 'CANCELLED':
        return {
          title: 'GATE PASS CANCELLED / VOID',
          subtitle: 'This booking transit permit was cancelled and is no longer valid',
          badgeText: 'CANCELLED',
          bgColor: 'bg-rose-600',
          textColor: 'text-rose-950',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: XCircle,
          border: 'border-rose-300'
        };
      default:
        return {
          title: 'INVALID GATE PASS',
          subtitle: 'Gate pass record not found in HarvestMitra verification registry',
          badgeText: 'INVALID RECORD',
          bgColor: 'bg-rose-700',
          textColor: 'text-rose-950',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: ShieldAlert,
          border: 'border-rose-300'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 flex flex-col justify-between font-sans">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between py-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-700 hover:text-emerald-700 transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>HarvestMitra Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 font-semibold">APMC Transit Registry</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4 animate-pulse">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Verifying Digital APMC Gate Pass...</h2>
            <p className="text-sm text-slate-500">Querying cryptographic transit registry in MySQL database.</p>
          </div>
        )}

        {/* Error / Invalid Pass State */}
        {!loading && errorMsg && (
          <div className="rounded-3xl bg-white border border-rose-200 shadow-xl overflow-hidden">
            <div className="p-6 bg-rose-700 text-white text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Gate Pass Not Found or Invalid</h1>
              <p className="text-xs text-rose-100 max-w-md mx-auto">{errorMsg}</p>
            </div>

            <div className="p-6 space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm space-y-2">
                <p className="font-bold">Scanned Identifier: <span className="font-mono text-rose-700">{code || 'None'}</span></p>
                <p className="text-xs text-rose-800">
                  This identifier does not match any active transit booking in the APMC database. Please ensure you have scanned an authentic HarvestMitra Gate Pass.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchVerification}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Verification</span>
                </button>
                <Link
                  to="/transport"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors text-center"
                >
                  Go to Transport Portal
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Successful Verification Display */}
        {!loading && passData && (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            {/* Header Banner */}
            <div className={`p-6 ${statusConfig.bgColor} text-white space-y-3`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest uppercase font-bold text-white/80 block">Government APMC Transit</span>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">Digital Mandi Gate Pass</h1>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs flex items-center gap-1.5 ${statusConfig.badgeBg}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusConfig.badgeText}</span>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-xs rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] text-white/70 block">Official Gate Pass ID</span>
                  <span className="font-mono font-black text-xl text-white tracking-widest">{passData.passId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPassId}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </button>
              </div>

              <p className="text-xs text-white/90 font-medium">
                {statusConfig.subtitle}
              </p>
            </div>

            {/* Verification Content Body */}
            <div className="p-6 space-y-6">
              {/* Privacy Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Lock className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-950 space-y-0.5">
                  <span className="font-bold block">
                    {passData.isAuthorized ? 'Authenticated Staff Clearance' : 'Privacy-Protected Public Clearance'}
                  </span>
                  <p className="text-emerald-800 text-[11px]">
                    {passData.isAuthorized
                      ? 'You are logged in with authorized Mandi / Transporter credentials. Full farmer identity and check-in controls unlocked.'
                      : 'Farmer contact details are protected under Maharashtra APMC Privacy Guidelines. Official commodity, destination, and vehicle details verified from live database.'}
                  </p>
                </div>
              </div>

              {/* Grid 1: Commodity & Transit */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Consignment & Cargo Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Registered Commodity</span>
                    <span className="text-base font-extrabold text-slate-900">{passData.cropName || 'Produce'}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Declared Harvest Weight</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {passData.weightKg ? `${passData.weightKg.toLocaleString()} ${passData.quantityUnit || 'kg'}` : '—'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Destination APMC Mandi</span>
                    <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{passData.destinationMarket || 'APMC Yard'}</span>
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Scheduled Transit Date</span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>{passData.pickupDate || 'Today'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Farmer & Origin */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Farmer Producer Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Farmer Name</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {passData.isAuthorized ? (passData.farmerName || 'Registered Producer') : (passData.farmerMaskedName || 'Farmer')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Farmer ID: #{passData.farmerId || '—'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Village & District</span>
                    <span className="text-sm font-bold text-slate-800">
                      {passData.village ? `${passData.village}, ` : ''}{passData.district || 'Maharashtra'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ Agristack Verified</span>
                  </div>

                  {passData.isAuthorized && passData.farmerPhone && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Farmer Contact (Staff Only)</span>
                        <span className="text-sm font-mono font-bold text-slate-900">{passData.farmerPhone}</span>
                      </div>
                      <a
                        href={`tel:${passData.farmerPhone}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 3: Assigned Transport & Driver */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Freight & Logistics Carrier</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Vehicle Registration Number</span>
                    <span className="text-sm font-mono font-black text-slate-900 uppercase">
                      {passData.vehicleNumber || 'Assigned on Dispatch'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Vehicle Classification</span>
                    <span className="text-sm font-bold text-slate-800">{passData.vehicleType || 'Commercial Freight'}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Weighbridge Status</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{passData.weighbridgeStatus || 'Pending Entry Inspection'}</span>
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Booking Reference</span>
                    <span className="text-xs font-mono font-bold text-slate-700 block mt-0.5">
                      {passData.bookingId || `TR-${passData.farmerId}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operator Check-in Action (Authorized Mandi Officials & Admins) */}
              {passData.canCheckIn && !checkInSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-center space-y-3 shadow-md">
                  <div className="flex items-center justify-center gap-2 text-emerald-900 font-extrabold text-sm">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span>APMC Mandi Gate Arrival Action</span>
                  </div>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Confirm that vehicle <span className="font-mono font-bold">{passData.vehicleNumber}</span> carrying <span className="font-bold">{passData.cropName}</span> has arrived at the Mandi entry barrier.
                  </p>
                  <button
                    type="button"
                    onClick={handleOperatorCheckin}
                    disabled={checkingIn}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{checkingIn ? 'Recording Arrival...' : 'Record Gate Entry & Mandi Check-In'}</span>
                  </button>
                </div>
              )}

              {checkInSuccess && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-center space-y-1">
                  <span className="text-sm font-extrabold text-blue-900">✓ Gate Arrival Successfully Recorded</span>
                  <p className="text-xs text-blue-800">Vehicle entry logged in Mandi arrival ledger.</p>
                </div>
              )}

              {/* Print / Share Action Buttons */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>

                <Link
                  to="/login"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Mandi Official Login</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Official Footer Verification Notice */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono space-y-0.5">
              <p className="font-bold text-slate-700">HarvestMitra AI • National Agritech & APMC Logistics Network</p>
              <p>Cryptographically verified transit clearance token • Issued under Maharashtra Agricultural Marketing Regulatory Framework</p>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 font-mono">
        © 2026 HarvestMitra AI • Real-Time Mandi Gate Pass System
      </footer>
    </div>
  );
}

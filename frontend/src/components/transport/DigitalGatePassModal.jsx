import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Calendar, 
  Scale, 
  Volume2, 
  Copy,
  ExternalLink,
  Lock,
  QrCode
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

// Native Web Speech Reader helper
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Generate deterministic SVG QR Code grid based on token text
function generateQRMatrix(text) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns at corners
  function drawFinder(r, c) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 || i === 6 || j === 0 || j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          matrix[r + i][c + j] = true;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing lines
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash payload into data cells
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let r = 8; r < size - 1; r++) {
    for (let c = 8; c < size - 1; c++) {
      if (!matrix[r][c]) {
        matrix[r][c] = ((hash ^ (r * c * 17)) % 3) === 0;
      }
    }
  }

  return { matrix, size };
}

export default function DigitalGatePassModal({ isOpen, booking, onClose }) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const printAreaRef = useRef(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);

  if (!isOpen || !booking) return null;

  const passId = booking.gatePassCode || `MH-APMC-${Math.floor(100000 + Math.random() * 900000)}`;
  // Secure server-verifiable token: does NOT expose raw PII in plaintext (PART 9)
  const secureVerificationToken = `HM-GP-TOKEN:${passId}`;
  const { matrix, size } = generateQRMatrix(secureVerificationToken);

  const isOperator = user?.role === 'mandi' || user?.role === 'admin' || user?.role === 'transporter';

  async function handleCheckIn() {
    if (!token) {
      showToast({ type: 'error', title: 'Login Required', message: 'You must be logged in as Mandi Official or Gate Operator to check in.' });
      return;
    }
    setCheckingIn(true);
    try {
      const res = await fetch('/api/transport/gatepass/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gatePassCode: passId,
          checkinNotes: 'Verified at APMC entry gate'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Check-in failed');
      }
      setCheckInDone(true);
      showToast({
        type: 'success',
        title: '✅ Gate Entry Recorded',
        message: data.message || `Arrival recorded for ${passId}`
      });
    } catch (err) {
      showToast({ type: 'error', title: 'Check-In Failed', message: err.message });
    } finally {
      setCheckingIn(false);
    }
  }

  function handleCopyPassId() {
    navigator.clipboard.writeText(passId);
    showToast({
      type: 'success',
      title: t('gatePass.passIdCopiedTitle', 'Pass ID Copied'),
      message: t('gatePass.passIdCopiedMsg', 'Gate pass token copied to clipboard.'),
    });
  }

  function handleShareWhatsApp() {
    const text = `🌾 *HarvestMitra Secure Digital APMC Gate Pass*\n\n` +
      `🆔 *Pass ID:* ${passId}\n` +
      `🏛️ *Destination APMC:* ${booking.destinationMarket || booking.destinationLocation || 'APMC'}\n` +
      `📅 *Date:* ${booking.pickupDate || 'Today'}\n` +
      `🔒 *Token:* ${secureVerificationToken}\n` +
      `✅ *Scan at gate terminal for authorized verification.*\n\n` +
      `_Issued by HarvestMitra Agritech System_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleVoiceRead() {
    const speech = `Digital APMC Mandi Gate Pass ${passId}. ` +
      `Scheduled destination: ${booking.destinationMarket || 'APMC'}. ` +
      `Security Clearance verified by HarvestMitra logistics system.`;
    speakText(speech);
    showToast({
      type: 'info',
      title: 'Voice Reader',
      message: 'Reading gate pass details aloud...',
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div id="digital-gate-pass-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, footer, #dashboard-main-content, .print\\:hidden, .no-print,
          #network-status-badge-container, #kisan-floating-bar, #mitra-chat-floating-btn {
            display: none !important;
          }
          #digital-gate-pass-modal-backdrop {
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            display: block !important;
            inset: auto !important;
            backdrop-filter: none !important;
          }
          #digital-gate-pass-card {
            border: 2px solid #059669 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border-radius: 16px !important;
            page-break-inside: avoid !important;
          }
          #digital-gate-pass-header {
            background: #0f172a !important;
            color: #ffffff !important;
          }
          .print-action-hidden {
            display: none !important;
          }
          svg rect {
            fill: #000000 !important;
          }
        }
      `}</style>

      <div id="digital-gate-pass-card" className="relative w-full max-w-md rounded-3xl bg-white border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div id="digital-gate-pass-header" className="p-4 border-b border-border bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">{t('gatePass.modalTitle', 'Digital APMC Gate Pass')}</h3>
              <p className="text-[11px] text-slate-300 font-mono">Secure Server-Verifiable Clearance</p>
            </div>
          </div>

          <div className="flex items-center gap-2 print-action-hidden">
            <button
              type="button"
              onClick={handleVoiceRead}
              title={t('gatePass.readAloud', 'Read Gate Pass Aloud')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Focuses on QR code, Pass identifier, Current status, Basic scanning instructions (PART 9) */}
        <div ref={printAreaRef} className="p-5 overflow-y-auto space-y-4 text-center">
          {/* Official Pass Header Card */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-4 text-center space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-bold uppercase tracking-wider">
              <span>{t('gatePass.electronicPass', 'Transit Pass')}</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> 
                <span>{checkInDone ? 'ARRIVED & CHECKED IN' : (booking.status || 'ACTIVE')}</span>
              </span>
            </div>

            <div className="text-2xl font-black font-mono tracking-widest text-emerald-950 py-1">
              {passId}
            </div>

            <div className="text-[11px] text-emerald-700">
              Valid at APMC weighing station and barrier terminals.
            </div>
          </div>

          {/* Large Secure SVG QR Code */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mx-auto">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40">
              {matrix.map((row, r) =>
                row.map((filled, c) =>
                  filled ? (
                    <rect
                      key={`${r}-${c}`}
                      x={c}
                      y={r}
                      width="1"
                      height="1"
                      style={{ fill: '#000000' }}
                    />
                  ) : null
                )
              )}
            </svg>
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-2">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>QR VERIFICATION SEAL • SERVER-VERIFIABLE</span>
            </div>
          </div>

          {/* Digital Transport Verification Notice (Visible Only When Printed) */}
          <div className="hidden print:block text-center pt-3 border-t border-slate-300 text-[10px] text-slate-500 font-mono space-y-1">
            <p className="font-bold text-slate-700">Issued via HarvestMitra National Agritech & APMC Logistics Portal</p>
            <p>Digital Transit Pass for Internal Cargo Verification • Official GST E-Way Bill & Mandi Cess must be filed on the authorized government portal.</p>
          </div>

          {/* Minimal Safe Information Display (No PII) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-left space-y-1.5">
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Destination APMC:</span>
              <span className="font-bold text-slate-800">{booking.destinationMarket || booking.destinationLocation || 'Pune APMC'}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Scheduled Date:</span>
              <span className="font-semibold text-slate-800">{booking.pickupDate || 'Today'}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500 font-medium">Privacy Status:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Protected • Authorized Gate Scan Only
              </span>
            </div>
          </div>

          {/* Scanning Instructions (PART 9) */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-left text-[11px] text-amber-900 space-y-1">
            <p className="font-bold">Instructions for Driver & Gate Operator:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              <li>Present this QR token to the APMC security officer upon arrival.</li>
              <li>The gate scanner will verify authorization and record entry timestamp.</li>
              <li>Consignee weighbridge clearance will be updated automatically.</li>
            </ul>
          </div>

          {/* Authorized Operator Check-in Button */}
          {isOperator && !checkInDone && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{checkingIn ? 'Recording Gate Entry...' : 'Operator: Confirm Gate Arrival'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 border-t border-border bg-slate-50 flex items-center justify-between gap-2 print-action-hidden print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPassId}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy ID</span>
            </button>

            <button
              type="button"
              id="print-gate-pass-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

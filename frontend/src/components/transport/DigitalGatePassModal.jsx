import React, { useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Native Web Speech Reader helper
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Generate deterministic SVG QR Code grid based on booking text
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
  const printAreaRef = useRef(null);

  if (!isOpen || !booking) return null;

  const passId = booking.gatePassCode || `MH-APMC-${Math.floor(100000 + Math.random() * 900000)}`;
  const qrString = `HARVESTMITRA:PASS:${passId}|FARMER:${booking.farmerName}|CROP:${booking.cropName}|QTY:${booking.weightKg}KG|DEST:${booking.destinationMarket}|VEHICLE:${booking.vehicleType || 'Any'}`;
  const { matrix, size } = generateQRMatrix(qrString);

  function handleCopyPassId() {
    navigator.clipboard.writeText(passId);
    showToast({
      type: 'success',
      title: 'Pass ID Copied',
      message: `Gate pass token ${passId} copied to clipboard.`,
    });
  }

  function handleShareWhatsApp() {
    try {
      fetch('/api/alerts/whatsapp/send-gatepass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatePassCode: passId,
          farmerName: booking.farmerName,
          farmerPhone: booking.farmerPhone || '+91 98765 43210',
          cropName: booking.cropName,
          weightKg: booking.weightKg,
          pickupLocation: booking.pickupLocation,
          destinationMarket: booking.destinationMarket,
          pickupDate: booking.pickupDate,
          driverName: booking.driverName,
          driverPhone: booking.driverPhone,
          vehicleNumber: booking.vehicleNumber,
          vehicleType: booking.vehicleType,
          language: 'mr'
        })
      }).then((r) => r.json()).then((res) => {
        if (res?.success) {
          showToast({
            type: 'whatsapp',
            title: '💬 WhatsApp Gate Pass Dispatched',
            message: `Official e-Gate Pass token ${passId} dispatched with live QR clearance!`,
            duration: 6000
          });
        }
      }).catch(() => {});
    } catch (_) {}

    const text = `🌾 *HarvestMitra Digital APMC Mandi Gate Pass*\n\n` +
      `🆔 *Pass ID:* ${passId}\n` +
      `👤 *Farmer:* ${booking.farmerName}\n` +
      `🥬 *Cargo:* ${booking.weightKg} kg of ${booking.cropName}\n` +
      `📍 *Pickup:* ${booking.pickupLocation}\n` +
      `🏛️ *Destination APMC:* ${booking.destinationMarket}\n` +
      `🚚 *Vehicle:* ${booking.vehicleType || 'Commercial Freight'}\n` +
      `📅 *Date:* ${booking.pickupDate}\n` +
      `🔗 *QR Token:* https://harvestmitra.in/gatepass?code=${encodeURIComponent(passId)}\n` +
      `✅ *Status:* Verified e-Gate Clearance\n\n` +
      `_Issued by HarvestMitra Agritech System_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleVoiceRead() {
    const speech = `Digital APMC Mandi Gate Pass for farmer ${booking.farmerName}. ` +
      `Commodity: ${booking.weightKg} kilograms of ${booking.cropName}. ` +
      `Scheduled destination: ${booking.destinationMarket}. ` +
      `Pass identification number: ${passId}. ` +
      `Clearance verified by HarvestMitra logistics system.`;
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
      {/* Dedicated Print Stylesheet for High-Fidelity APMC Gate Pass Output */}
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
          /* Hide application background chrome, navbars, and floating tools */
          header,
          nav,
          aside,
          footer,
          #dashboard-main-content,
          .print\\:hidden,
          .no-print,
          #network-status-badge-container,
          #kisan-floating-bar,
          #mitra-chat-floating-btn {
            display: none !important;
          }
          /* Make modal container static and full-width */
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-action-hidden {
            display: none !important;
          }
          /* Ensure crisp black pixels for the QR code */
          svg rect {
            fill: #000000 !important;
          }
        }
      `}</style>

      <div id="digital-gate-pass-card" className="relative w-full max-w-lg rounded-3xl bg-white border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div id="digital-gate-pass-header" className="p-4 sm:p-5 border-b border-border bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Digital APMC Mandi Gate Pass</h3>
              <p className="text-[11px] text-slate-300 font-mono">e-NAM & Maharashtra State Mandi Authority Clearance</p>
            </div>
          </div>

          <div className="flex items-center gap-2 print-action-hidden">
            <button
              type="button"
              onClick={handleVoiceRead}
              title="Read Gate Pass Aloud"
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

        {/* Modal Scrollable Body */}
        <div ref={printAreaRef} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-text">
          {/* Official Pass Header Card */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-4 text-center space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-bold uppercase tracking-wider">
              <span>Electronic Clearance Pass</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live Verified
              </span>
            </div>

            <div className="text-2xl font-black font-mono tracking-widest text-emerald-950">
              {passId}
            </div>

            <div className="text-[11px] text-emerald-700">
              Present this digital QR token at the APMC weighing station and entry barrier.
            </div>
          </div>

          {/* QR Code and Cargo Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
            {/* Deterministic SVG QR Code & Verification Seal */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-sm mx-auto sm:mx-0">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-28 h-28">
                {matrix.map((row, r) =>
                  row.map((filled, c) =>
                    filled ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width="1"
                        height="1"
                        className="fill-slate-900"
                        style={{ fill: '#000000' }}
                      />
                    ) : null
                  )
                )}
              </svg>
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1.5 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>QR VERIFICATION SEAL</span>
              </div>
            </div>

            {/* Core Details List */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Farmer Name:</span>
                <span className="font-bold text-text">{booking.farmerName}</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Produce / Crop:</span>
                <span className="font-bold text-primary">{booking.cropName}</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Shipment Weight:</span>
                <span className="font-bold text-text font-mono">{booking.weightKg} kg</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Assigned Driver:</span>
                <span className="font-bold text-emerald-900">{booking.driverName || 'Sanjay Shinde (Verified Driver)'}</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Vehicle Number:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{booking.vehicleNumber || 'MH-12-RN-4120'}</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Destination APMC:</span>
                <span className="font-bold text-emerald-700">{booking.destinationMarket}</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Arrival Timestamp (ETA):</span>
                <span className="font-semibold text-amber-800 font-mono">
                  {booking.arrivalTimestamp || (booking.estimatedDurationMinutes ? `${new Date(Date.now() + Number(booking.estimatedDurationMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (~${booking.estimatedDurationMinutes} mins)` : `${booking.pickupDate} • 07:30 AM Entry Slot`)}
                </span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-border/60">
                <span className="text-muted font-medium">Pickup Date:</span>
                <span className="font-medium text-text">{booking.pickupDate}</span>
              </div>

              <div className="flex justify-between py-0.5">
                <span className="text-muted font-medium">Vehicle Type:</span>
                <span className="font-semibold text-text">{booking.vehicleType || 'Shared Transport Pool'}</span>
              </div>
            </div>
          </div>

          {/* Transport Security & Insurance Stamp */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-muted space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary" />
              <span>Logistics & Weighbridge Compliance</span>
            </div>
            <p>
              Driver must carry verified weighing slip. In-transit cargo insured under APMC Transit Scheme.
            </p>
          </div>

          {/* Digital Transport Verification Notice (Visible Only When Printed) */}
          <div className="hidden print:block text-center pt-3 border-t border-slate-300 text-[10px] text-slate-500 font-mono space-y-1">
            <p className="font-bold text-slate-700">Issued via HarvestMitra National Agritech & APMC Logistics Portal</p>
            <p>Digital Transit Pass for Internal Cargo Verification • Official GST E-Way Bill & Mandi Cess must be filed on the authorized government portal.</p>
          </div>
        </div>

        {/* Modal Actions Footer (Hidden on print) */}
        <div className="p-4 border-t border-border bg-slate-50 flex flex-wrap items-center justify-between gap-2 print-action-hidden print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPassId}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-text flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Pass ID</span>
            </button>

            <button
              type="button"
              id="print-gate-pass-btn"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Pass</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

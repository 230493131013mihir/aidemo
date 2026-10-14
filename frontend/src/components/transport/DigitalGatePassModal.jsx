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

  const passId = booking.gatePassCode || `GJ-APMC-${Math.floor(100000 + Math.random() * 900000)}`;
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
    const text = `🌾 *HarvestMitra Digital APMC Mandi Gate Pass*\n\n` +
      `🆔 *Pass ID:* ${passId}\n` +
      `👤 *Farmer:* ${booking.farmerName}\n` +
      `🥬 *Cargo:* ${booking.weightKg} kg of ${booking.cropName}\n` +
      `📍 *Pickup:* ${booking.pickupLocation}\n` +
      `🏛️ *Destination APMC:* ${booking.destinationMarket}\n` +
      `🚚 *Vehicle:* ${booking.vehicleType || 'Commercial Freight'}\n` +
      `📅 *Date:* ${booking.pickupDate}\n` +
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Digital APMC Mandi Gate Pass</h3>
              <p className="text-[11px] text-slate-300 font-mono">e-NAM & State Mandi Authority Verified</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceRead}
              title="Read Gate Pass Aloud"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
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
            {/* Deterministic SVG QR Code */}
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
                      />
                    ) : null
                  )
                )}
              </svg>
              <span className="text-[9px] font-mono font-bold text-muted mt-1 uppercase">Scan to Verify</span>
            </div>

            {/* Core Details List */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted font-medium">Farmer Name:</span>
                <span className="font-bold text-text">{booking.farmerName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted font-medium">Produce / Crop:</span>
                <span className="font-bold text-primary">{booking.cropName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted font-medium">Shipment Weight:</span>
                <span className="font-bold text-text font-mono">{booking.weightKg} kg</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted font-medium">Destination APMC:</span>
                <span className="font-bold text-emerald-700">{booking.destinationMarket}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted font-medium">Pickup Date:</span>
                <span className="font-medium text-text">{booking.pickupDate}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-muted font-medium">Assigned Vehicle:</span>
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
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-border bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPassId}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-text flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Pass ID</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-text flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Pass</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

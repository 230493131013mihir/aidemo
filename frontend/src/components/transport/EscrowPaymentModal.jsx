import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  Smartphone, 
  ArrowRight,
  AlertCircle,
  Truck,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Procedural SVG QR code matrix generator
function generateQRMatrix(text) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

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

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let r = 8; r < size - 1; r++) {
    for (let c = 8; c < size - 1; c++) {
      if (!matrix[r][c]) {
        matrix[r][c] = ((hash ^ (r * c * 19)) % 3) === 0;
      }
    }
  }
  return matrix;
}

export default function EscrowPaymentModal({ isOpen, booking, onClose, onPaymentSuccess }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedApp, setSelectedApp] = useState('gpay');

  if (!isOpen || !booking) return null;

  const fareAmount = Number(booking.estimatedSharedCost || booking.finalCost || 1200);
  const upiPayload = `upi://pay?pa=harvestmitra.escrow@icici&pn=HarvestMitra+AgriEscrow&am=${fareAmount}&cu=INR&tn=Freight+Escrow+Booking+${booking.id}`;
  const qrMatrix = generateQRMatrix(upiPayload);

  async function handleAuthorizePayment() {
    setSubmitting(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/transport/bookings/${booking.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Payment authorization failed');
      }

      showToast({
        type: 'celebrate',
        title: '🛡️ Freight Escrow Locked!',
        message: `₹${fareAmount.toLocaleString('en-IN')} is securely held in HarvestMitra Escrow. Funds transfer to driver only after you confirm delivery!`,
        duration: 5000
      });

      if (onPaymentSuccess) onPaymentSuccess(json.data);
      onClose();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Payment Failed',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                  Secure UPI Escrow
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  #{booking.bookingId || `BK-${booking.id}`}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Lock Freight Fare in Escrow
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Trip Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{booking.cropName}</span>
                <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {booking.weightKg} kg
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span>{booking.pickupLocation}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-slate-700">{booking.destinationMarket}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Freight Fare</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                ₹{fareAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* HarvestMitra SafeEscrow Protection Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">100% Zero-Risk Farmer Guarantee</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                Your payment remains locked in HarvestMitra Escrow. The transporter receives the payout <strong>ONLY AFTER</strong> you verify and confirm that your produce reached the mandi safely.
              </p>
            </div>
          </div>

          {/* Dynamic UPI QR Code Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Scan to Pay via any UPI App</span>
            </span>

            {/* Rendered SVG QR */}
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              <svg width="150" height="150" viewBox="0 0 21 21" className="shape-rendering-crispEdges">
                {qrMatrix.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
                  )
                )}
              </svg>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block">
                harvestmitra.escrow@icici
              </span>
              <p className="text-[11px] text-slate-500">
                Supports Google Pay, PhonePe, Paytm, BHIM & All UPI Banking Apps
              </p>
            </div>

            {/* Quick App Select */}
            <div className="grid grid-cols-4 gap-2 w-full pt-1">
              {[
                { id: 'gpay', label: 'Google Pay' },
                { id: 'phonepe', label: 'PhonePe' },
                { id: 'paytm', label: 'Paytm' },
                { id: 'bhim', label: 'BHIM UPI' }
              ].map(app => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedApp(app.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedApp === app.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {app.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleAuthorizePayment}
            className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {submitting
                ? 'Securing Escrow...'
                : `Authorize & Lock ₹${fareAmount.toLocaleString('en-IN')}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

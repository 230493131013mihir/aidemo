import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  Truck, 
  User, 
  ThumbsUp, 
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const STAR_LABELS = {
  1: 'Poor — Cargo mishandled or severe delays',
  2: 'Below Average — Arrived late or cargo issues',
  3: 'Satisfactory — Standard transport fulfilled',
  4: 'Very Good — Punctual and careful driving',
  5: 'Exceptional — 5-Star driver! Fast, careful & polite'
};

const QUICK_TAGS = [
  '⚡ On-Time Farm Pickup',
  '🥦 Careful Cargo Handling',
  '🛡️ Waterproof Tarp Tied Well',
  '🤝 Polite & Professional Driver',
  '⚖️ Fast Mandi Weighbridge Turnaround',
  '🛣️ Smooth Highway Driving'
];

export default function DriverRatingModal({ isOpen, booking, onClose, onReviewSuccess }) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  function toggleTag(tag) {
    let nextTags;
    if (selectedTags.includes(tag)) {
      nextTags = selectedTags.filter(t => t !== tag);
    } else {
      nextTags = [...selectedTags, tag];
    }
    setSelectedTags(nextTags);

    // Merge tags nicely into review comment
    const baseReview = review.split(' • ')[0] || '';
    if (nextTags.length > 0) {
      setReview(`${baseReview ? baseReview + ' • ' : ''}${nextTags.join(', ')}`);
    }
  }

  async function handleSubmitReview() {
    setSubmitting(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/transport/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          rating,
          review: review.trim() || `${rating}-Star delivery confirmed at ${booking.destinationMarket}.`
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit driver review');
      }

      showToast({
        type: 'celebrate',
        title: '⭐ Driver Rated!',
        message: `Thank you! Your ${rating}★ review for ${booking.driverName || 'driver'} has been recorded.`,
        duration: 5000
      });

      if (onReviewSuccess) onReviewSuccess(json.data);
      onClose();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Rating Submission Failed',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-300">
                Verified Farmer Review
              </span>
              <h2 className="text-lg font-black text-white">
                Rate Driver & Delivery
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Driver & Trip Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Driver</span>
              <span className="font-extrabold text-sm text-slate-900 block">
                {booking.driverName || 'Transporter Partner'}
              </span>
              <span className="text-xs text-slate-500">
                Vehicle: {booking.vehicleNumber || 'Commercial Truck'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivered at</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                {booking.destinationMarket}
              </span>
            </div>
          </div>

          {/* Interactive Star Rating Selector */}
          <div className="text-center py-2 space-y-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
              Tap stars to rate your experience
            </span>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs font-bold text-slate-800 min-h-[1.25rem]">
              {STAR_LABELS[activeRating]}
            </p>
          </div>

          {/* Quick Review Feedback Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Highlights
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Comment Box */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Feedback / Comments (Optional)</span>
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="e.g. Dinesh arrived promptly, tied tarps securely over tomatoes, and unloaded promptly at APMC."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Skip / Close
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitReview}
            className="bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Star className="w-4 h-4 fill-white" />
            <span>{submitting ? 'Submitting...' : `Submit ${rating}★ Review`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

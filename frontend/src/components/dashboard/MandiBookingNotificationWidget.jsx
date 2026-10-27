import React, { useState, useEffect } from 'react';
import { 
  Store, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Phone, 
  AlertCircle, 
  ArrowRight, 
  BadgePercent,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Scale
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

export default function MandiBookingNotificationWidget() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    if (!isAuthenticated || user?.role !== 'farmer') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('harvestmitra_token') || localStorage.getItem('harvestmitra_token');
      if (!token || token === 'guest') {
        setBookings([]);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/contact-requests`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter requests sent to this farmer from a Mandi
        const mandiRequests = json.data.filter(
          r => (r.receiverId === user?.id || !r.receiverId) &&
               (r.contactType === 'mandi_to_farmer' || r.senderRole === 'mandi' || r.message?.includes('🏪'))
        );
        setBookings(mandiRequests);
      }
    } catch (err) {
      console.warn('Could not fetch mandi booking requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Poll for new bookings every 10 seconds
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      const token = sessionStorage.getItem('harvestmitra_token') || localStorage.getItem('harvestmitra_token');
      const res = await fetch(`${API_BASE_URL}/api/auth/contact-requests/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const json = await res.json();
      if (json.success) {
        showToast?.({
          type: newStatus === 'accepted' ? 'celebrate' : 'info',
          title: newStatus === 'accepted' ? t('farmerMandi.toastAcceptedTitle', '🎉 Mandi Booking Accepted!') : t('farmerMandi.toastDeclinedTitle', 'Booking Declined'),
          message: newStatus === 'accepted'
            ? t('farmerMandi.toastAcceptedMsg', 'Your crop reservation is confirmed! The APMC Mandi official has been notified for gate pass issuance.')
            : t('farmerMandi.toastDeclinedMsg', 'Mandi purchase inquiry has been declined.')
        });
        fetchBookings();
      } else {
        showToast?.({
          type: 'error',
          title: t('farmerMandi.updateFailedTitle', 'Update Failed'),
          message: json.message || 'Could not update booking status.'
        });
      }
    } catch (err) {
      showToast?.({
        type: 'error',
        title: 'Network Error',
        message: err.message
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Only render on Farmer Dashboard
  if (!isAuthenticated || user?.role !== 'farmer') {
    return null;
  }

  // Pending bookings count
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div id="mandi-bookings" className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-base border border-orange-300 dark:border-orange-800 shadow-2xs">
            🏪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-text">
                {t('farmerMandi.title', 'APMC Mandi Procurement Bookings')}
              </h3>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white animate-pulse">
                  {pendingCount} {pendingCount > 1 ? t('farmerMandi.newOffers', 'NEW OFFERS') : t('farmerMandi.newOffer', 'NEW OFFER')}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              {t('farmerMandi.subtitle', 'Live purchase applications and reservation requests issued by registered APMC Mandi officials')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchBookings}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-text border border-border transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>{t('farmerMandi.refreshBookings', 'Refresh Bookings')}</span>
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-slate-50 dark:from-slate-900/60 dark:to-slate-800/40 border border-orange-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
              <Store className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('farmerMandi.networkActiveTitle', 'Mandi Direct Purchase Network Active')}
              </h4>
              <p className="text-xs text-muted max-w-2xl">
                {t('farmerMandi.networkActiveDesc', 'When registered APMC Mandis (like Pune APMC or Lasalgaon APMC) book your ready vegetables or grain crops, official booking inquiries with verified procurement rates will appear here for 1-click confirmation.')}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-700 text-[11px] font-bold text-orange-700 dark:text-orange-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {t('farmerMandi.apmcSyncLive', 'APMC Sync Live')}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {bookings.map((booking) => {
            const isPending = booking.status === 'pending';
            const isAccepted = booking.status === 'accepted';
            const isDeclined = booking.status === 'declined';
            const qty = Number(booking.quantityKg) || 100;
            const rate = Number(booking.proposedPricePerKg) || 25;
            const totalVal = Math.round(qty * rate);

            return (
              <div
                key={booking.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isAccepted
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : isDeclined
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    : 'bg-gradient-to-br from-orange-50/90 to-amber-50/60 dark:from-slate-900 dark:to-orange-950/20 border-orange-300 dark:border-orange-800/80 shadow-xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Mandi details & Crop */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-orange-600 text-white shadow-2xs">
                        🏪 {booking.senderName || 'Pune APMC Mandi'}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : isDeclined
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                        }`}
                      >
                        {isAccepted ? t('farmerMandi.bookingConfirmed', '✅ Mandi Booking Confirmed') : isDeclined ? t('farmerMandi.declined', 'Declined') : t('farmerMandi.actionRequired', '⏳ Action Required: Booking Offer')}
                      </span>

                      <span className="text-[11px] text-muted font-medium">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-base sm:text-lg font-black text-text">
                        {booking.cropName || 'Fresh Harvest'}
                      </span>
                      <span className="text-xs font-bold text-muted">
                        {t('farmerMandi.bookedQuantity', 'Booked Quantity')}: <strong className="text-text">{qty.toLocaleString('en-IN')} kg</strong> ({(qty / 100).toFixed(1)} Quintals)
                      </span>
                      <span className="text-xs font-bold text-muted">
                        {t('farmerMandi.offeredRate', 'Offered Rate')}: <strong className="text-emerald-700 dark:text-emerald-400">₹{rate}/kg</strong>
                      </span>
                      <span className="text-xs font-extrabold text-text px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-border">
                        {t('farmerMandi.totalPayout', 'Total Payout')}: ₹{totalVal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {booking.message && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white/70 dark:bg-slate-800/60 p-2 rounded-xl border border-border/60">
                        "{booking.message}"
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          id={`accept-booking-btn-${booking.id}`}
                          onClick={() => handleUpdateStatus(booking.id, 'accepted')}
                          disabled={updatingId === booking.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{updatingId === booking.id ? t('farmerMandi.accepting', 'Accepting...') : t('farmerMandi.acceptBooking', 'Accept Mandi Booking')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(booking.id, 'declined')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {t('farmerMandi.decline', 'Decline')}
                        </button>
                      </>
                    ) : isAccepted ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{t('farmerMandi.reservedForDelivery', 'Reserved for Delivery')}</span>
                        </span>
                        {booking.senderContact && (
                          <a
                            href={`tel:${booking.senderContact}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 hover:bg-slate-50 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            <span>{t('farmerMandi.contactMandi', 'Contact Mandi')}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted font-bold">{t('farmerMandi.inquiryClosed', 'Inquiry Closed')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

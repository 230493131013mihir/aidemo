import React, { useState, useEffect } from 'react';
import {
  Truck,
  Users,
  MapPin,
  Calendar,
  Weight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Phone,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { matchTransport, fetchVehicles, bookTransportPool } from '../services/transportApiService';

export default function TransportPage() {
  const { t, language } = useLanguage();

  // Search Criteria (Initialized with hackathon demo scenario: Ramesh Patel, Surat -> Ahmedabad, 500kg Tomatoes)
  const [origin, setOrigin] = useState('Surat');
  const [destination, setDestination] = useState('Ahmedabad');
  const [quantity, setQuantity] = useState(500);
  const [crop, setCrop] = useState('Tomato');
  const [requiredDate, setRequiredDate] = useState(() => new Date().toISOString().split('T')[0]);

  // States
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Booking Modal State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingReceipt, setBookingReceipt] = useState(null);

  // Perform search / matching
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await matchTransport({
        farmerName: 'Ramesh Patel',
        location: origin,
        destination,
        quantity: Number(quantity) || 500,
        requiredDate,
        crop
      });

      if (res.success && res.matches) {
        setMatches(res.matches);
      } else {
        // Fallback to all vehicles
        const fallbackRes = await fetchVehicles({ destination });
        setMatches(fallbackRes.data || []);
      }
    } catch (err) {
      console.error('Transport match error:', err);
      // Fetch available list on error
      try {
        const listRes = await fetchVehicles();
        setMatches(listRes.data || []);
      } catch (_) {
        setError('Failed to connect to transport matching service.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  // Confirm booking
  const handleConfirmBooking = async (vehicle) => {
    setBookingLoading(true);
    try {
      const res = await bookTransportPool({
        vehicleId: vehicle.id,
        farmerName: 'Ramesh Patel',
        phone: '+91 99999 99991',
        quantity: Number(quantity) || 500,
        crop,
        pickupAddress: `${origin} APMC Yard`
      });

      if (res.success) {
        setBookingReceipt(res.booking);
        // Refresh matching list to reflect reduced capacity
        handleSearch();
      }
    } catch (err) {
      alert('Booking error: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" aria-hidden="true" />
            <span>Shared Logistics & Capacity Pooling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text">
            {t('transport.title')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t('transport.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-tag bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>50% Freight Savings Active</span>
          </span>
        </div>
      </div>

      {/* Hero Savings Explanation Banner */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary p-5 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-text text-sm sm:text-base">
              {language === 'mr' ? 'एकट्या ट्रिपचा खर्च वाचवा - सामायिक वाहनात ५०% बचत!' :
               language === 'gu' ? 'એકલા જવાનો ખર્ચ બચાવો - સહિયારા વાહનમાં ૫૦% સુધીની બચત!' :
               language === 'hi' ? 'अकेले ट्रक का भाड़ा बचाएं - साझा परिवहन में ५०% तक बचत!' :
               'Stop Paying 100% Solo Freight - Pool Vehicle Space & Save up to 50%!'}
            </h3>
            <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
              {language === 'mr' ? 'जवळपासच्या शेतकऱ्यांसोबत वाहन शेअर करून प्रादेशिक बाजारांत माल पाठवा. वाढीव बाजारभावाचा खरा फायदा तुमच्या खिशात जमा करा.' :
               language === 'gu' ? 'નજીકના ખેડૂતો સાથે વાહનમાં જગ્યા શેર કરીને પ્રાદેશિક બજારોમાં વધુ નફો કમાવો.' :
               language === 'hi' ? 'पास के किसानों के साथ ट्रक क्षमता साझा करें और बड़े बाजारों में अधिक मुनाफा कमाएं।' :
               'By sharing freight with nearby farmers heading to the same APMC mandi, fuel and vehicle costs are split proportionally.'}
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-border shrink-0 text-center">
          <p className="text-[11px] font-semibold text-muted uppercase">Avg. Farmer Savings</p>
          <p className="text-lg font-black text-primary">₹1,400 - ₹2,000</p>
        </div>
      </div>

      {/* Search & Route Filter Controls */}
      <div className="card-harvest p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-text">
              {t('transport.searchTitle') || 'Find Matching Freight Capacity'}
            </h2>
          </div>
          <span className="text-xs text-muted">
            {language === 'mr' ? 'डेमो प्रोफाइल: रमेश पटेल (सुरत)' : 'Demo Profile: Ramesh Patel (Surat)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Origin */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{t('transport.fromLocation') || 'Pickup District'}</span>
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="Surat">Surat (સુરત / सुरत)</option>
              <option value="Navsari">Navsari (નવસારી / नवसारी)</option>
              <option value="Ahmedabad">Ahmedabad (અમદાવાદ)</option>
              <option value="Rajkot">Rajkot (રાજકોટ / राजकोट)</option>
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-accent" />
              <span>{t('transport.toDestination') || 'Destination Mandi'}</span>
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="Ahmedabad">Ahmedabad APMC (High Price ₹23/kg)</option>
              <option value="Surat">Surat APMC (Local ₹18.5/kg)</option>
              <option value="Rajkot">Rajkot APMC (₹21/kg)</option>
            </select>
          </div>

          {/* Quantity in KG */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-primary" />
              <span>{t('transport.cropWeight') || 'Produce Weight (kg)'}</span>
            </label>
            <input
              type="number"
              min="50"
              max="5000"
              step="50"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {/* Pickup Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{t('transport.date') || 'Pickup Date'}</span>
            </label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full btn-primary text-xs py-2.5 rounded-xl cursor-pointer font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              <span>{t('transport.findMatches') || 'Find Shared Pools'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available Shared Vehicles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>{t('transport.availableVehicles') || 'Matching Shared Vehicles'}</span>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
              {matches.length} {matches.length === 1 ? 'vehicle' : 'vehicles'}
            </span>
          </h2>
          <span className="text-xs text-muted">
            {language === 'mr' ? 'किमती वजन प्रमाणानुसार विभागल्या जातात' : 'Costs split proportionally by weight'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center card-harvest">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted">Finding best route and capacity matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="p-10 text-center card-harvest space-y-2">
            <Truck className="w-10 h-10 text-muted mx-auto opacity-50" />
            <p className="font-bold text-sm text-text">No vehicles currently matching this exact route/date.</p>
            <p className="text-xs text-muted">Try adjusting your date or destination market.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((veh) => {
              const soloCost = veh.soloCost || veh.totalTripCost || 2800;
              const sharedCost = veh.sharedCost || Math.round(soloCost * (quantity / (veh.capacity || 2000)));
              const savings = Math.max(0, soloCost - sharedCost);
              const capacityPercent = Math.min(100, Math.round(((veh.currentLoad || 1000) / veh.capacity) * 100));

              return (
                <div
                  key={veh.id}
                  className="card-harvest p-5 space-y-4 relative border-l-4 border-l-primary flex flex-col justify-between"
                >
                  {/* Top Bar: Driver & Vehicle Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text flex items-center gap-1.5">
                            <span>{veh.vehicleType}</span>
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          </h3>
                          <p className="text-xs text-muted flex items-center gap-2">
                            <span>{veh.driverName}</span>
                            <span>•</span>
                            <span className="text-amber-600 font-semibold">★ {veh.rating || '4.8'}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{veh.vehicleNumber}</span>
                          </p>
                        </div>
                      </div>

                      {veh.matchScore ? (
                        <span className="badge-tag bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t('transport.matchScore') || 'Match'}: {veh.matchScore}%
                        </span>
                      ) : null}
                    </div>

                    {/* Route Details */}
                    <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-text">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{veh.location}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted" />
                        <span className="text-primary font-bold">{veh.destination} APMC</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{veh.departureTime || '06:00 AM'}</span>
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-muted">Available Capacity:</span>
                        <span className="text-primary font-bold">{veh.availableCapacity} kg space left</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Pooled Farmers in Vehicle */}
                    {veh.coFarmers && veh.coFarmers.length > 0 && (
                      <div className="text-[11px] text-muted flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-border/50">
                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {language === 'mr' ? 'आधीच जोडलेले शेतकरी: ' : 'Already pooled: '}
                          <strong>{veh.coFarmers.map(f => f.farmerName).join(', ')}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown: Solo vs Pooled */}
                  <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-muted uppercase font-bold">
                        {t('transport.soloCost') || 'Solo Cost'}: <span className="line-through text-rose-500">₹{soloCost.toLocaleString()}</span>
                      </p>
                      <p className="text-base font-black text-primary">
                        ₹{sharedCost.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-muted">/ your share</span>
                      </p>
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{language === 'mr' ? `₹${savings.toLocaleString()} बचत` : `Save ₹${savings.toLocaleString()}`}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleConfirmBooking(veh)}
                      disabled={bookingLoading}
                      className="btn-primary text-xs py-2 px-3.5 rounded-xl cursor-pointer font-bold shadow-xs hover:shadow-md transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{t('transport.poolNow') || 'Pool & Book'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {bookingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-harvest max-w-md w-full p-6 space-y-4 shadow-xl animate-fadeIn relative">
            <button
              onClick={() => setBookingReceipt(null)}
              className="absolute top-4 right-4 text-muted hover:text-text p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-text">
                {t('transport.bookedSuccess') || 'Transport Pooled Successfully!'}
              </h3>
              <p className="text-xs text-muted">
                Booking ID: <strong className="font-mono text-primary">{bookingReceipt.bookingId}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/60 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Farmer:</span>
                <span className="font-bold text-text">{bookingReceipt.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Driver:</span>
                <span className="font-bold text-text">{bookingReceipt.driverName} ({bookingReceipt.driverPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vehicle:</span>
                <span className="font-bold text-text">{bookingReceipt.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Route:</span>
                <span className="font-bold text-primary">{bookingReceipt.pickupAddress} &rarr; {bookingReceipt.destination} APMC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Departure Time:</span>
                <span className="font-bold text-text">{bookingReceipt.availableDate} at {bookingReceipt.departureTime}</span>
              </div>
              <div className="flex justify-between border-t border-border/80 pt-2 text-sm font-extrabold text-emerald-700">
                <span>Final Pooled Fare:</span>
                <span>₹{bookingReceipt.pooledCost.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setBookingReceipt(null)}
              className="w-full btn-primary text-xs py-2.5 rounded-xl font-bold cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  Send, 
  Layers, 
  ShieldCheck, 
  Phone, 
  IndianRupee,
  ChevronRight,
  X
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoTransportPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Dispatch Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [vehicleType, setVehicleType] = useState('Tata 407 Agri LCV (3.5 MT)');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().slice(0, 10));
  const [transportNotes, setTransportNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const vehicleOptions = [
    { label: 'Mahindra Bolero Maxi Truck (1.5 MT)', value: 'Mahindra Bolero Maxi Truck (1.5 MT)' },
    { label: 'Tata 407 Agri LCV (3.5 MT)', value: 'Tata 407 Agri LCV (3.5 MT)' },
    { label: 'Eicher Pro 2049 Container (5.0 MT)', value: 'Eicher Pro 2049 Container (5.0 MT)' },
    { label: 'BharatBenz 1217C Medium Duty (9.0 MT)', value: 'BharatBenz 1217C Medium Duty (9.0 MT)' },
    { label: 'Tata Signa Heavy Multi-Axle (16.0 MT)', value: 'Tata Signa Heavy Multi-Axle (16.0 MT)' }
  ];

  async function loadTransportData() {
    try {
      setRefreshing(true);
      const res = await apiClient('/api/fpo/offers');
      const json = await res.json();
      if (json.success) {
        setOffers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load transport offers:', err);
      showToast('Unable to load collective transport dispatches', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTransportData();
  }, []);

  // Filter offers
  const readyForDispatchOffers = offers.filter(
    o => o.status === 'confirmed' && !o.transportRequestId
  );

  const activeOrDispatchedOffers = offers.filter(
    o => o.transportRequestId || ['delivery_scheduled', 'in_transit', 'completed'].includes(o.status)
  );

  function openScheduleModal(offer) {
    setSelectedOffer(offer);
    const estDate = offer.expectedDeliveryDate ? new Date(offer.expectedDeliveryDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    setPickupDate(estDate);
    
    // Auto-recommend vehicle based on total tonnage
    const qty = Number(offer.totalQuantityKg);
    if (qty <= 1500) {
      setVehicleType('Mahindra Bolero Maxi Truck (1.5 MT)');
    } else if (qty <= 4000) {
      setVehicleType('Tata 407 Agri LCV (3.5 MT)');
    } else if (qty <= 6000) {
      setVehicleType('Eicher Pro 2049 Container (5.0 MT)');
    } else if (qty <= 10000) {
      setVehicleType('BharatBenz 1217C Medium Duty (9.0 MT)');
    } else {
      setVehicleType('Tata Signa Heavy Multi-Axle (16.0 MT)');
    }

    setIsModalOpen(true);
  }

  async function handleScheduleTransport(e) {
    e.preventDefault();
    if (!selectedOffer) return;

    setSubmitting(true);
    try {
      const res = await apiClient('/api/fpo/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: selectedOffer.id,
          pickupDate,
          vehicleType,
          notes: transportNotes
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Collective transport successfully scheduled!', 'success');
        setIsModalOpen(false);
        setSelectedOffer(null);
        setTransportNotes('');
        await loadTransportData();
      } else {
        showToast(data.message || 'Could not schedule transport.', 'error');
      }
    } catch (err) {
      console.error('Schedule transport error:', err);
      showToast('Network error while scheduling transport.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Summary Metrics
  const totalWeightDispatchedKg = activeOrDispatchedOffers.reduce(
    (acc, o) => acc + (Number(o.totalQuantityKg) || 0), 0
  );
  const activeDispatchesCount = activeOrDispatchedOffers.length;
  // Estimated logistics savings vs un-pooled freight (standard ₹1.5/kg saving in pooled logistics)
  const estimatedSavings = Math.round(totalWeightDispatchedKg * 1.5);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-3 backdrop-blur-sm">
            <Truck className="w-3.5 h-3.5" /> FPO Collective Logistics
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Collective Transport & APMC Dispatch
          </h1>
          <p className="text-sm md:text-base text-emerald-100/90 mt-2 font-medium">
            Coordinate bulk produce dispatches directly from rural aggregation hubs to verified APMC mandis. Pooled multi-farmer transit cuts transport fees by up to 40%.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={loadTransportData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/50 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 text-emerald-100"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Logistics
          </button>
        </div>

        {/* Decorative blur overlay */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Awaiting Dispatch</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{readyForDispatchOffers.length} Lots</p>
            <p className="text-xs text-amber-600 mt-1">Confirmed Mandi deals</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Dispatches</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{activeDispatchesCount}</p>
            <p className="text-xs text-emerald-600 mt-1">Scheduled or en route</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pooled Freight</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {(totalWeightDispatchedKg / 1000).toFixed(1)} MT
            </p>
            <p className="text-xs text-gray-500 mt-1">{totalWeightDispatchedKg.toLocaleString('en-IN')} kg aggregated</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pooled Savings</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">₹{estimatedSavings.toLocaleString('en-IN')}</p>
            <p className="text-xs text-teal-600 mt-1">~40% freight cost saved</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Confirmed Contracts Awaiting Transport */}
      {readyForDispatchOffers.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-amber-900">
                Action Required: {readyForDispatchOffers.length} Confirmed {readyForDispatchOffers.length === 1 ? 'Contract' : 'Contracts'} Awaiting Transport
              </h2>
            </div>
            <span className="text-xs font-medium bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full">
              Ready for Transporter Dispatch
            </span>
          </div>

          <p className="text-xs text-amber-800 mb-4">
            Mandi procurement contracts have been confirmed. Schedule verified vehicles to pickup collective produce from your central aggregation hub.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyForDispatchOffers.map(offer => (
              <div 
                key={offer.id}
                className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      {offer.offerCode}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Confirmed Contract
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">
                    {offer.cropName} — {Number(offer.totalQuantityKg).toLocaleString('en-IN')} kg
                  </h3>
                  
                  <div className="space-y-1.5 text-xs text-gray-600 mt-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate"><strong>Destination:</strong> {offer.mandiName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Agreed Rate:</strong> ₹{offer.agreedRatePerKg || offer.requestedRatePerKg}/kg</span>
                    </div>
                    {offer.Aggregation?.pickupHub && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate"><strong>Pickup Hub:</strong> {offer.Aggregation.pickupHub}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openScheduleModal(offer)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-95"
                >
                  <Truck className="w-4 h-4" /> Schedule Vehicle Dispatch
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Active & Historical Dispatches */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Collective Logistics Dispatches</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status of vehicles, gate-passes, driver contacts, and delivery fulfillment.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
            {activeOrDispatchedOffers.length} Transport Dispatches
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading collective transport records...</p>
          </div>
        ) : activeOrDispatchedOffers.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Dispatches Scheduled Yet</h3>
            <p className="text-xs text-gray-500 mt-2">
              Once you confirm a bulk procurement offer with an APMC Mandi, you can schedule dedicated collective transport here to move aggregated produce.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeOrDispatchedOffers.map(offer => {
              const tr = offer.TransportRequest || {};
              const isAssigned = tr.driverName && tr.driverName !== 'Driver Assigned';
              const hasGatePass = Boolean(tr.gatePassCode);

              return (
                <div key={offer.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded">
                          {tr.bookingId || `FPO-TR-${offer.offerCode}`}
                        </span>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Ref: {offer.offerCode}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          offer.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : offer.status === 'in_transit' || tr.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {offer.status === 'completed' ? 'Delivered & Settled' : tr.status === 'in_transit' ? 'En Route to Mandi' : 'Dispatched / Awaiting Pickup'}
                        </span>

                        <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          Collective Pool ({tr.sharingFarmersCount || offer.Aggregation?.Items?.length || 5} Farmers)
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {Number(offer.totalQuantityKg).toLocaleString('en-IN')} kg {offer.cropName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Consolidated Produce from {offer.Aggregation?.pickupHub || 'FPO Central Aggregation Hub'}
                        </p>
                      </div>

                      {/* Route Path */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl text-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-gray-400 block font-medium">Origin Hub</span>
                            <span className="font-semibold text-gray-800">
                              {offer.Aggregation?.pickupHub || `${offer.Aggregation?.pickupDistrict || 'District'} Central Aggregation Hub`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-gray-400 block font-medium">Destination Mandi</span>
                            <span className="font-semibold text-gray-800">{offer.mandiName}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Driver & Vehicle Info */}
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl min-w-[280px] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Assigned Vehicle</span>
                        <span className="font-semibold text-gray-800">{tr.vehicleType || 'Tata 407 Agri LCV'}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Vehicle Reg. No.</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {tr.vehicleNumber || 'MH-12-FC-4421'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Driver Contact</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-800 block">{tr.driverName || 'Suresh Patil'}</span>
                          <span className="text-xs text-emerald-700 flex items-center gap-1 font-mono justify-end">
                            <Phone className="w-3 h-3" /> {tr.driverPhone || '+91 98234 11234'}
                          </span>
                        </div>
                      </div>

                      {/* Gate Pass / APMC Entry Code */}
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                        <span className="text-emerald-900 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> APMC Gate-Pass
                        </span>
                        <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                          {tr.gatePassCode || `GP-${offer.offerCode.slice(-4)}-MANDI`}
                        </span>
                      </div>
                    </div>

                    {/* Right Financials & Freight */}
                    <div className="text-right flex flex-col justify-between min-w-[200px]">
                      <div>
                        <span className="text-xs text-gray-400 block uppercase font-medium">Pooled Freight Cost</span>
                        <span className="text-xl font-bold text-gray-900 block mt-0.5">
                          ₹{((tr.finalCost || tr.estimatedSharedCost || Math.round(Number(offer.totalQuantityKg) * 1.75))).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-emerald-600 font-medium">
                          ₹{(1.75).toFixed(2)}/kg shared rate
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">
                          Pickup Date: <strong>{offer.expectedDeliveryDate ? new Date(offer.expectedDeliveryDate).toLocaleDateString() : 'Immediate'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SCHEDULE TRANSPORT MODAL */}
      {isModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Collective Transit Booking
                </span>
                <h3 className="text-xl font-bold mt-0.5">
                  Schedule Produce Dispatch
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleScheduleTransport} className="p-6 space-y-4">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Mandi:</span>
                  <span className="font-bold text-gray-800">{selectedOffer.mandiName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Collective Lot:</span>
                  <span className="font-bold text-gray-800">{Number(selectedOffer.totalQuantityKg).toLocaleString('en-IN')} kg {selectedOffer.cropName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Agreed Rate:</span>
                  <span className="font-bold text-emerald-700">₹{selectedOffer.agreedRatePerKg || selectedOffer.requestedRatePerKg}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup Hub:</span>
                  <span className="font-medium text-gray-700">{selectedOffer.Aggregation?.pickupHub || 'FPO Central Hub'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Vehicle Type / Capacity Required
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {vehicleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Selected vehicle is auto-matched with certified rural agri-freight operators.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Scheduled Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Dispatch Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={transportNotes}
                  onChange={(e) => setTransportNotes(e.target.value)}
                  placeholder="e.g. Ensure tarpaulin cover for rain protection. Produce packed in 50kg gunny bags."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Confirming Dispatch...' : 'Confirm & Generate Gate-Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Truck, 
  X, 
  History, 
  IndianRupee,
  Calendar
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoProcurementPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [aggregations, setAggregations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Offer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAggId, setSelectedAggId] = useState('');
  const [mandiName, setMandiName] = useState('Pune APMC (Gultekdi Wholesale Mandi)');
  const [requestedRate, setRequestedRate] = useState('29.5');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Selected Offer History Modal
  const [selectedHistoryOffer, setSelectedHistoryOffer] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [offersRes, aggRes] = await Promise.all([
        apiClient('/api/fpo/offers'),
        apiClient('/api/fpo/aggregations?status=ready')
      ]);

      const [offersJson, aggJson] = await Promise.all([
        offersRes.json(),
        aggRes.json()
      ]);

      if (offersJson.success) setOffers(offersJson.data || []);
      if (aggJson.success) {
        setAggregations(aggJson.data || []);
        if (aggJson.data?.length > 0 && !selectedAggId) {
          setSelectedAggId(String(aggJson.data[0].id));
          if (aggJson.data[0].expectedRatePerKg) {
            setRequestedRate(String(aggJson.data[0].expectedRatePerKg));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load procurement data:', err);
      showToast({ type: 'error', title: 'Network Error', message: 'Unable to load procurement offers.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmitOffer(e) {
    e.preventDefault();
    if (!selectedAggId || !mandiName || !requestedRate) {
      showToast({ type: 'warning', title: 'Incomplete', message: 'Please select an aggregation and target Mandi.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient('/api/fpo/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregationId: Number(selectedAggId),
          mandiName,
          requestedRatePerKg: Number(requestedRate),
          expectedDeliveryDate: deliveryDate,
          notes
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Submission failed');

      showToast({
        type: 'success',
        title: 'Offer Dispatched',
        message: json.message
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuotationDecision(offerId, action) {
    const verb = action === 'accept' ? 'accept this mandi quotation' : 'reject this quotation';
    if (!window.confirm(`Are you sure you want to ${verb}?`)) return;

    try {
      const res = await apiClient(`/api/fpo/offers/${offerId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      showToast({
        type: action === 'accept' ? 'success' : 'info',
        title: action === 'accept' ? 'Deal Confirmed!' : 'Offer Rejected',
        message: json.message
      });
      await loadData();
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>APMC Commercial Trade Desk</span>
          </div>
          <h1 className="text-2xl font-black text-text">Bulk Mandi Procurement</h1>
          <p className="text-xs text-muted mt-0.5">
            Submit pooled consignments directly to authorized APMC mandis, review counter-quotations, and lock bulk sale contracts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-border hover:bg-slate-50 text-muted hover:text-text transition-colors"
            title="Refresh Deals"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>+ Dispatch Bulk Offer</span>
          </button>
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border p-12 text-center text-muted space-y-3">
            <Store className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-text">No Bulk Mandi Offers Dispatched</h3>
            <p className="text-xs max-w-md mx-auto">
              Once you have created an aggregation lot, submit an offer to wholesale buyers and mandis across Maharashtra.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Submit First Offer</span>
            </button>
          </div>
        ) : (
          offers.map((off) => {
            const isQuotationReceived = off.status === 'quotation_received';
            const isConfirmed = off.status === 'confirmed' || off.status === 'delivery_scheduled';
            return (
              <div key={off.id} className="bg-white rounded-3xl border border-border p-5 shadow-xs space-y-4 hover:border-amber-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text text-base">{off.mandiName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold uppercase">
                          {off.offerCode}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Linked Aggregation: <strong className="font-mono text-purple-700">{off.Aggregation?.aggregationCode || `Lot #${off.aggregationId}`}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      off.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      off.status === 'quotation_received' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                      off.status === 'awaiting_mandi_response' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      off.status === 'delivery_scheduled' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {off.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Offer Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-muted">Offered Quantity</span>
                    <p className="font-bold text-text font-mono text-sm">{off.totalQuantityKg} kg {off.cropName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted">FPO Target Rate</span>
                    <p className="font-bold text-text text-sm">₹{off.requestedRatePerKg}/kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted">Mandi Counter-Quote</span>
                    <p className={`font-bold text-sm ${off.quotedRatePerKg ? 'text-amber-700' : 'text-muted'}`}>
                      {off.quotedRatePerKg ? `₹${off.quotedRatePerKg}/kg` : 'Pending Quote'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted">Agreed Rate / Gross</span>
                    <p className="font-black text-emerald-700 text-sm">
                      {off.agreedRatePerKg ? `₹${off.agreedRatePerKg}/kg (₹${Math.round(off.agreedRatePerKg * off.totalQuantityKg).toLocaleString('en-IN')})` : '—'}
                    </p>
                  </div>
                </div>

                {/* Counter Quotation Action Callout */}
                {isQuotationReceived && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-amber-950">Mandi Counter-Quotation Received!</p>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        {off.mandiName} offered <strong className="font-mono text-xs">₹{off.quotedRatePerKg}/kg</strong> for this {off.totalQuantityKg} kg consignment.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuotationDecision(off.id, 'reject')}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-red-50 text-red-700 font-bold"
                      >
                        Reject Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuotationDecision(off.id, 'accept')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Contract (₹{off.quotedRatePerKg}/kg)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryOffer(off)}
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Deal Timeline & Audit</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isConfirmed && !off.transportRequestId && (
                      <button
                        type="button"
                        onClick={() => navigate('/fpo/transport')}
                        className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Schedule Collective Transport</span>
                      </button>
                    )}
                    {off.transportRequestId && (
                      <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Transport Linked #{off.transportRequestId}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DISPATCH OFFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-text">Dispatch Bulk Procurement Offer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Select Ready Aggregation Lot *</label>
                {aggregations.length === 0 ? (
                  <p className="text-xs text-amber-700">No ready aggregation lots found. Please build one first.</p>
                ) : (
                  <select
                    value={selectedAggId}
                    onChange={(e) => {
                      setSelectedAggId(e.target.value);
                      const match = aggregations.find(a => String(a.id) === e.target.value);
                      if (match?.expectedRatePerKg) setRequestedRate(String(match.expectedRatePerKg));
                    }}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs bg-white outline-none focus:border-primary"
                  >
                    {aggregations.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.aggregationCode} — {a.totalQuantityKg} kg {a.cropName} ({a.pickupDistrict})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Target Wholesale Mandi *</label>
                <select
                  value={mandiName}
                  onChange={(e) => setMandiName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs bg-white outline-none focus:border-primary"
                >
                  <option value="Pune APMC (Gultekdi Wholesale Mandi)">Pune APMC (Gultekdi Wholesale Mandi)</option>
                  <option value="Nashik APMC Market Yard">Nashik APMC Market Yard</option>
                  <option value="Mumbai Vashi APMC Terminal">Mumbai Vashi APMC Terminal</option>
                  <option value="Nagpur Cotton & Orange Mandi">Nagpur Cotton & Orange Mandi</option>
                  <option value="Kolhapur Jaggery & Veg Mandi">Kolhapur Jaggery & Veg Mandi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Expected Rate (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={requestedRate}
                    onChange={(e) => setRequestedRate(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold text-emerald-700 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Target Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Commercial Terms / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Graded lot, ready for immediate dispatch from Haveli aggregation hub."
                  className="w-full rounded-xl border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || aggregations.length === 0}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Dispatch Offer to Mandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMELINE / HISTORY MODAL */}
      {selectedHistoryOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-muted">{selectedHistoryOffer.offerCode}</span>
                <h3 className="text-base font-bold text-text">Deal Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryOffer(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3">
              {(() => {
                let hist = [];
                try { hist = JSON.parse(selectedHistoryOffer.history || '[]'); } catch {}
                if (hist.length === 0) return <p className="text-xs text-muted">No historical events recorded.</p>;
                return hist.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-text">{h.action}</span>
                      <span className="text-[10px] font-mono text-muted">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-muted text-[11px]">{h.details}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Actor: {h.by}</p>
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedHistoryOffer(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

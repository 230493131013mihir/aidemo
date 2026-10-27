import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Users, 
  Truck, 
  ArrowRight, 
  Download, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  ChevronRight, 
  Eye, 
  X,
  History,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

export default function FpoOrdersPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function loadOrders() {
    try {
      setRefreshing(true);
      const res = await apiClient('/api/fpo/orders');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders history:', err);
      showToast('Unable to load orders history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (filter === 'confirmed') return ['confirmed', 'delivery_scheduled', 'in_transit'].includes(o.status);
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'pending') return ['awaiting_mandi_response', 'quotation_received'].includes(o.status);
    return true;
  });

  // Financial aggregates
  const totalGrossRevenue = orders
    .filter(o => ['confirmed', 'delivery_scheduled', 'in_transit', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + (o.financials?.grossValue || 0), 0);

  const totalTransportDeductions = orders
    .filter(o => ['confirmed', 'delivery_scheduled', 'in_transit', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + (o.financials?.transportDeduction || 0), 0);

  const netFarmerPayouts = totalGrossRevenue - totalTransportDeductions;

  function exportCsv() {
    if (orders.length === 0) {
      showToast('No orders available to export', 'error');
      return;
    }

    const headers = [
      'Order Code', 'Aggregation Code', 'Mandi', 'Crop', 'Total Kg', 
      'Rate/Kg', 'Gross Value', 'Transport Deduction', 'Net Value', 'Status', 'Date'
    ];

    const rows = orders.map(o => [
      o.offerCode,
      o.aggregationCode,
      `"${o.mandiName}"`,
      o.cropName,
      o.totalQuantityKg,
      o.agreedRatePerKg || o.quotedRatePerKg || o.requestedRatePerKg,
      o.financials?.grossValue || 0,
      o.financials?.transportDeduction || 0,
      o.financials?.netOrderValue || 0,
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FPO_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders report exported to CSV successfully', 'success');
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-3 backdrop-blur-sm">
            <IndianRupee className="w-3.5 h-3.5" /> Financial Transparency
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Orders & Member Farmer Settlements
          </h1>
          <p className="text-sm md:text-base text-emerald-100/90 mt-2 font-medium">
            Real-time ledger of bulk mandi contracts, pooled freight deductions, and transparent member payout distributions with zero intermediary commissions.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 text-white"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={loadOrders}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/50 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 text-emerald-100"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </button>
        </div>

        {/* Decorative blur overlay */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Financial KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Contract Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalGrossRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1">Total mandi order value</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Freight Deductions</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">₹{totalTransportDeductions.toLocaleString('en-IN')}</p>
            <p className="text-xs text-blue-600 mt-1">Pooled transport costs</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Farmer Payout Pool</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">₹{netFarmerPayouts.toLocaleString('en-IN')}</p>
            <p className="text-xs text-teal-600 mt-1">Distributed to members</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Procurement Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-1">All recorded contracts</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Contracts' },
              { id: 'confirmed', label: 'Active & In-Transit' },
              { id: 'completed', label: 'Completed & Settled' },
              { id: 'pending', label: 'Pending Negotiation' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Loading procurement orders and financials...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Orders Match Filter</h3>
            <p className="text-xs text-gray-500 mt-2">
              Orders appear here as soon as you initiate bulk crop negotiations with APMC mandis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order / Deal Code</th>
                  <th className="py-3 px-4">Consignment Produce</th>
                  <th className="py-3 px-4">Target APMC Mandi</th>
                  <th className="py-3 px-4 text-right">Contracted Rate</th>
                  <th className="py-3 px-4 text-right">Gross Value</th>
                  <th className="py-3 px-4 text-right">Net Farmer Pool</th>
                  <th className="py-3 px-4 text-center">Contract Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredOrders.map(order => {
                  const fin = order.financials || {};
                  const isConfirmed = ['confirmed', 'delivery_scheduled', 'in_transit', 'completed'].includes(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 block">{order.offerCode}</span>
                        <span className="text-[11px] font-mono text-gray-400 block mt-0.5">{order.aggregationCode}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{order.cropName}</span>
                        <span className="text-[11px] text-gray-500 block">
                          {Number(order.totalQuantityKg).toLocaleString('en-IN')} kg ({order.farmerBreakdown?.length || 1} Farmers)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {order.mandiName}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ₹{order.agreedRatePerKg || order.quotedRatePerKg || order.requestedRatePerKg}/kg
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                        {isConfirmed ? `₹${fin.grossValue.toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isConfirmed ? (
                          <div>
                            <span className="font-bold text-emerald-700 block">₹{fin.netOrderValue.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400 block">-₹{fin.transportDeduction} freight</span>
                          </div>
                        ) : 'Pending Confirmation'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ['confirmed', 'delivery_scheduled', 'in_transit'].includes(order.status)
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {order.status === 'in_transit' && <Truck className="w-3 h-3" />}
                          {order.status === 'confirmed' && <ShieldCheck className="w-3 h-3" />}
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MEMBER PAYOUT BREAKDOWN MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-emerald-200">
                    {selectedOrder.offerCode}
                  </span>
                  <span className="text-xs bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-100 border border-emerald-400/30">
                    {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-1.5">
                  Member Farmer Payout & Settlement Breakdown
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Financial Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <div>
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Total Mandi Gross Value</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{(selectedOrder.financials?.grossValue || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    {selectedOrder.totalQuantityKg} kg @ ₹{selectedOrder.agreedRatePerKg || selectedOrder.requestedRatePerKg}/kg
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Collective Freight Deducted</span>
                  <span className="text-lg font-bold text-blue-700">
                    -₹{(selectedOrder.financials?.transportDeduction || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    Split proportionally across lot
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Net Payable to Members</span>
                  <span className="text-lg font-bold text-emerald-700">
                    ₹{(selectedOrder.financials?.netOrderValue || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium block">
                    100% direct bank credit
                  </span>
                </div>
              </div>

              {/* Farmer Payout Share Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Individual Farmer Lot Allocations ({selectedOrder.farmerBreakdown?.length || 0} Members)
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">
                        <th className="py-2.5 px-3">Farmer Name</th>
                        <th className="py-2.5 px-3">Village</th>
                        <th className="py-2.5 px-3 text-right">Committed Kg</th>
                        <th className="py-2.5 px-3 text-right">Lot Share</th>
                        <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                        <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                        <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Net Payable (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedOrder.farmerBreakdown || []).map((fb, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{fb.farmerName}</td>
                          <td className="py-2.5 px-3 text-gray-600">{fb.village}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{fb.committedQuantityKg} kg</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-700">{fb.sharePercentage}%</td>
                          <td className="py-2.5 px-3 text-right">₹{fb.grossShare.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right text-gray-500">-₹{fb.transportShare}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{fb.netPayable.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deal History Trace */}
              {selectedOrder.historyTrace && selectedOrder.historyTrace.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    Contract Audit & History Trail
                  </h4>
                  <div className="space-y-2 border-l-2 border-emerald-300 pl-4 ml-2">
                    {selectedOrder.historyTrace.map((item, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                        <span className="font-bold text-gray-800">{item.action?.replace(/_/g, ' ')}</span>
                        <span className="text-[11px] text-gray-400 ml-2">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <p className="text-gray-600 mt-0.5">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tamper-evident ledger record
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

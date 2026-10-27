import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Store, 
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { 
  fetchSaleRecords, 
  createSaleRecord, 
  updateSaleRecord, 
  deleteSaleRecord, 
  fetchProfitSummary, 
  seedDemoSales 
} from '../../services/saleService';

const MAHARASHTRA_APMCS = [
  'Pune APMC (Gultekdi)',
  'Mumbai Vashi Mega APMC',
  'Lasalgaon Mandi (Nashik)',
  'Nagpur Cotton & Orange Mandi',
  'Kolhapur APMC',
  'Solapur APMC',
  'Latur APMC',
  'Ahmednagar APMC',
  'Amravati APMC'
];

export default function SaleHistorySection({ registeredCrops = [], userDistrict = 'Pune' }) {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    cropName: registeredCrops.length > 0 ? registeredCrops[0].cropName : 'Tomato',
    quantity: '1000',
    unit: 'kg',
    marketName: 'Pune APMC (Gultekdi)',
    ratePerQuintal: '2600',
    transportCost: '1800',
    inputCost: '4500',
    mandiCess: '260',
    saleDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    paymentStatus: 'completed',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [salesData, summaryData] = await Promise.all([
        fetchSaleRecords({
          crop: selectedCrop,
          market: selectedMarket,
          paymentStatus: selectedStatus
        }),
        fetchProfitSummary()
      ]);
      setSales(salesData.sales || []);
      setSummary(summaryData.summary || null);
    } catch (err) {
      setError(err.message || 'Failed to load sale history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCrop, selectedMarket, selectedStatus]);

  // Auto-seed demo sales if user has no sales
  const handleSeedDemo = async () => {
    try {
      setLoading(true);
      await seedDemoSales();
      setSuccessMsg('Sample Maharashtra APMC sale history loaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to load sample sales');
    } finally {
      setLoading(false);
    }
  };

  // Live calculation for form
  const computedGrossAndNet = useMemo(() => {
    const qty = Number(formData.quantity) || 0;
    const unit = formData.unit;
    let qtyKg = qty;
    if (unit === 'quintal') qtyKg = qty * 100;
    if (unit === 'tonne') qtyKg = qty * 1000;

    const rate = Number(formData.ratePerQuintal) || 0;
    const quintals = qtyKg / 100;
    const gross = Math.round(quintals * rate * 100) / 100;
    const transport = Math.max(0, Number(formData.transportCost) || 0);
    const input = Math.max(0, Number(formData.inputCost) || 0);
    const cess = Math.max(0, Number(formData.mandiCess) || 0);
    const net = Math.round((gross - transport - input - cess) * 100) / 100;

    return { qtyKg, quintals, gross, net };
  }, [formData.quantity, formData.unit, formData.ratePerQuintal, formData.transportCost, formData.inputCost, formData.mandiCess]);

  const handleOpenAddModal = () => {
    setEditingSale(null);
    setFormData({
      cropName: registeredCrops.length > 0 ? registeredCrops[0].cropName : 'Tomato',
      quantity: '1000',
      unit: 'kg',
      marketName: MAHARASHTRA_APMCS[0],
      ratePerQuintal: '2600',
      transportCost: '1800',
      inputCost: '4500',
      mandiCess: '260',
      saleDate: new Date().toISOString().split('T')[0],
      buyerName: '',
      paymentStatus: 'completed',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sale) => {
    setEditingSale(sale);
    setFormData({
      cropName: sale.cropName,
      quantity: String(sale.quantityKg),
      unit: sale.unit || 'kg',
      marketName: sale.marketName,
      ratePerQuintal: String(sale.ratePerQuintal),
      transportCost: String(sale.transportCost || 0),
      inputCost: String(sale.inputCost || 0),
      mandiCess: String(sale.mandiCess || 0),
      saleDate: sale.saleDate,
      buyerName: sale.buyerName || '',
      paymentStatus: sale.paymentStatus || 'completed',
      notes: sale.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      if (editingSale) {
        await updateSaleRecord(editingSale.id, formData);
        setSuccessMsg('Sale record updated successfully!');
      } else {
        await createSaleRecord(formData);
        setSuccessMsg('New sale recorded successfully!');
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save sale record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale record?')) return;
    try {
      await deleteSaleRecord(id);
      setSuccessMsg('Sale record removed.');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete sale record');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueCrops = useMemo(() => {
    const list = new Set();
    sales.forEach(s => list.add(s.cropName));
    registeredCrops.forEach(c => list.add(c.cropName));
    return Array.from(list);
  }, [sales, registeredCrops]);

  return (
    <section id="farmer-sale-history-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Farmer Sale History & Realized Profit Report
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Verified Records
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Actual completed APMC mandi sales, net profit realizations (gross proceeds − transport − inputs − cess), and audit-ready profit reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
            title="Print or Save PDF Profit Report"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          {sales.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Load Sample APMC Sales</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Completed Sale</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Key Metrics Summary Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Realized Revenue</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
              ₹{summary.totalGrossProceeds.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
              {summary.totalSalesCount} Completed Sales
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Net Profit Realized</span>
            <p className="text-xl sm:text-2xl font-black text-blue-900 mt-1">
              ₹{summary.totalNetProfit.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-blue-700/80 mt-0.5 block">
              Margin: <strong>{summary.overallProfitMarginPercent}%</strong>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Total Transport Paid</span>
            <p className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
              ₹{summary.totalTransportCost.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-amber-700/80 mt-0.5 block">
              Direct Mandi Freight
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Volume Sold</span>
            <p className="text-xl sm:text-2xl font-black text-purple-900 mt-1">
              {(summary.totalQuantityKg / 100).toFixed(1)} <span className="text-sm font-bold">Qtl</span>
            </p>
            <span className="text-[11px] text-purple-700/80 mt-0.5 block">
              {summary.totalQuantityKg.toLocaleString('en-IN')} kg produce
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/90 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Avg Mandi Realization</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{summary.averageRealizedRatePerQuintal.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              per Quintal realized
            </span>
          </div>
        </div>
      )}

      {/* 3. Actual Realized Sales vs Simulator Projections Comparison Card */}
      {summary?.estimatedRevenueComparison && summary.estimatedRevenueComparison.simulatedProjection > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950 uppercase tracking-wider">
                Variance Analysis
              </span>
              <span className="text-xs text-emerald-200 font-semibold">
                Actual Realized Sales vs Harvest Simulator Projections
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Your registered harvest projection was <strong>₹{summary.estimatedRevenueComparison.simulatedProjection.toLocaleString('en-IN')}</strong>. 
              Realized proceeds to date: <strong className="text-white">₹{summary.estimatedRevenueComparison.realizedProceeds.toLocaleString('en-IN')}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Variance</span>
              <span className={`text-base font-extrabold flex items-center justify-end gap-1 ${
                summary.estimatedRevenueComparison.varianceAmount >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {summary.estimatedRevenueComparison.varianceAmount >= 0 ? '+' : ''}
                ₹{summary.estimatedRevenueComparison.varianceAmount.toLocaleString('en-IN')} ({summary.estimatedRevenueComparison.variancePercent}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters:</span>
          </span>

          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Crops</option>
            {uniqueCrops.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All APMC Mandis</option>
            {MAHARASHTRA_APMCS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="completed">Completed / Paid</option>
            <option value="pending">Payment Pending</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{sales.length}</strong> record{sales.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* 5. Sales Records Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading verified sale records...</span>
        </div>
      ) : sales.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <Store className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">No sale records found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You haven't logged any sales matching the selected filters yet. Record your actual APMC sales to generate an official profit report.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
            >
              Log First Sale
            </button>
            <button
              type="button"
              onClick={handleSeedDemo}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 cursor-pointer"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Mandi / Market</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Rate (₹/Qtl)</th>
                <th className="py-3 px-4 text-right">Gross (₹)</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Profit (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sales.map((sale) => {
                const totalDeductions = (sale.transportCost || 0) + (sale.inputCost || 0) + (sale.mandiCess || 0);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {sale.saleDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {sale.cropName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[180px] truncate" title={sale.marketName}>
                      <span className="font-semibold text-slate-800">{sale.marketName}</span>
                      {sale.buyerName && (
                        <span className="block text-[10px] text-slate-400">Buyer: {sale.buyerName}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <strong>{sale.quantityKg.toLocaleString('en-IN')} kg</strong>
                      <span className="text-[10px] text-slate-400 block">({(sale.quantityKg / 100).toFixed(1)} Qtl)</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                      ₹{sale.ratePerQuintal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      ₹{Math.round(sale.grossProceeds).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-500">
                      <span className="font-semibold text-red-600">-₹{Math.round(totalDeductions).toLocaleString('en-IN')}</span>
                      <span className="block text-[10px] text-slate-400">
                        Freight: ₹{sale.transportCost || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`font-black text-sm ${sale.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        ₹{Math.round(sale.netProfit).toLocaleString('en-IN')}
                      </span>
                      {sale.grossProceeds > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-bold">
                          {Math.round((sale.netProfit / sale.grossProceeds) * 100)}% margin
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.paymentStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sale.paymentStatus === 'completed' ? 'Paid / Settled' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sale)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Edit Sale"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sale.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Modal: Add / Edit Sale Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <DollarSign className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {editingSale ? 'Edit Sale Record' : 'Log New Completed Sale'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Crop Name */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Crop Sold *</label>
                  <input
                    type="text"
                    required
                    value={formData.cropName}
                    onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                    placeholder="e.g. Tomato, Onion, Soybean"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Mandi / Market */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Mandi / Market *</label>
                  <select
                    value={formData.marketName}
                    onChange={(e) => setFormData({ ...formData, marketName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {MAHARASHTRA_APMCS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="Local Village Mandi / Farmgate">Local Village Mandi / Farmgate</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Quantity *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="tonne">tonne</option>
                    </select>
                  </div>
                </div>

                {/* Mandi Rate */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Mandi Rate (₹ / Quintal) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={formData.ratePerQuintal}
                    onChange={(e) => setFormData({ ...formData, ratePerQuintal: e.target.value })}
                    placeholder="Rate per 100 kg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Transport Cost */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Transport / Freight Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.transportCost}
                    onChange={(e) => setFormData({ ...formData, transportCost: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Input Cost */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Input Costs (Seeds/Fertilizer/Labor) (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.inputCost}
                    onChange={(e) => setFormData({ ...formData, inputCost: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Mandi Cess */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Mandi Cess / Commission (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.mandiCess}
                    onChange={(e) => setFormData({ ...formData, mandiCess: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Sale Date */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Sale Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Buyer Name */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Buyer / Commission Agent</label>
                  <input
                    type="text"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    placeholder="e.g. Patil Brothers Trading"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block mb-1 text-slate-700 font-bold">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="completed">Completed / Settled</option>
                    <option value="pending">Pending Payment</option>
                  </select>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-bold">Calculated Gross Realization:</span>
                  <span className="font-extrabold text-emerald-950 text-sm">
                    ₹{computedGrossAndNet.gross.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-emerald-200/60 pt-1.5">
                  <span className="text-emerald-900 font-extrabold">Estimated Net Take-Home Profit:</span>
                  <span className={`font-black text-base ${computedGrossAndNet.net >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>
                    ₹{computedGrossAndNet.net.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingSale ? 'Save Changes' : 'Confirm & Save Sale')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

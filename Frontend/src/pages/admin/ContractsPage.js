import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import { rentApi } from '../../utils/api';

/* ─── helpers ─────────────────────────────────────────────── */
function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Status config - exactly the four values chk_contract_status allows ─── */
const STATUS_CFG = {
  ACTIVE:    { bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  COMPLETED: { bg: 'bg-sky-100 text-sky-800 border border-sky-200',           dot: 'bg-sky-500',     label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100 text-red-800 border border-red-200',           dot: 'bg-red-500',     label: 'Cancelled' },
  PENDING:   { bg: 'bg-amber-100 text-amber-800 border border-amber-200',     dot: 'bg-amber-500',   label: 'Pending' },
};

/* ─── Payment status - exactly the four values chk_payment_status allows ─── */
const PAY_STATUS_CFG = {
  PAID:    { bg: 'bg-emerald-100 text-emerald-700', icon: '✓' },
  PENDING: { bg: 'bg-amber-100 text-amber-700',     icon: '⏳' },
  OVERDUE: { bg: 'bg-red-100 text-red-700',         icon: '!' },
  WAIVED:  { bg: 'bg-slate-100 text-slate-700',     icon: '∅' },
};

/* ─── Payment Modal ───────────────────────────────────────── */
function PaymentModal({ contract, payments, onClose, onSuccess }) {
  const [method, setMethod]       = useState(''); // '' | 'paypal' | 'card'
  const [installmentNo, setInstallmentNo] = useState('next');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Credit card fields
  const [cardNumber, setCardNumber]     = useState('');
  const [cardHolder, setCardHolder]     = useState('');
  const [expMonth, setExpMonth]         = useState('');
  const [expYear, setExpYear]           = useState('');
  const [cvv, setCvv]                   = useState('');

  const pendingPayments = payments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'OVERDUE');
  const nextPending     = pendingPayments.sort((a, b) => a.installmentNo - b.installmentNo)[0];

  const selectedInstallment = installmentNo === 'next'
    ? nextPending
    : pendingPayments.find(p => p.installmentNo === Number(installmentNo));

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handlePayPal = async () => {
    if (!selectedInstallment) return;
    setLoading(true); setError('');
    try {
      const successUrl = `${window.location.origin}/paypal/callback`;
      const cancelUrl  = `${window.location.origin}/contracts`;
      const res = await rentApi.createPayPalPayment(contract.contractId, {
        currency: 'USD',
        description: `Rent installment #${selectedInstallment.installmentNo} — Contract #${contract.contractId}`,
        successUrl,
        cancelUrl,
        installmentNo: selectedInstallment.installmentNo,
      });
      const { approvalUrl, paymentId } = res.data || {};
      if (!approvalUrl) throw new Error('No PayPal approval URL received.');
      sessionStorage.setItem('paypal_contract_id', String(contract.contractId));
      sessionStorage.setItem('paypal_payment_id', paymentId || '');
      sessionStorage.setItem('paypal_installment_no', String(selectedInstallment.installmentNo));
      window.location.href = approvalUrl;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'PayPal initiation failed.');
      setLoading(false);
    }
  };

  const handleCard = async () => {
    if (!selectedInstallment) return;
    setLoading(true); setError('');
    try {
      await rentApi.createCardPayment(contract.contractId, {
        cardNumber:     cardNumber.replace(/\s/g, ''),
        cardHolderName: cardHolder,
        expiryMonth:    expMonth,
        expiryYear:     expYear,
        cvv,
        installmentNo:  selectedInstallment.installmentNo,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Card payment failed. Please check your details.');
      setLoading(false);
    }
  };

  const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 28 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">Contract #{contract.contractId}</p>
            <h2 className="text-white text-xl font-black mt-0.5">Make a Payment</h2>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors text-2xl leading-none font-light">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Installment selector */}
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🎉</span>
              <p className="mt-3 text-slate-700 font-bold">All installments paid!</p>
              <p className="text-slate-500 text-sm mt-1">No pending payments on this contract.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Choose Installment
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${installmentNo === 'next' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input
                      type="radio" name="installment" value="next"
                      checked={installmentNo === 'next'}
                      onChange={() => setInstallmentNo('next')}
                      className="accent-sky-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">
                        Next Due — Installment #{nextPending?.installmentNo}
                      </p>
                      <p className="text-xs text-slate-500">
                        ${fmt(nextPending?.amountDue)} · Due {formatDate(nextPending?.dueDate)}
                        {nextPending?.paymentStatus === 'OVERDUE' && (
                          <span className="ml-2 text-red-600 font-bold">OVERDUE</span>
                        )}
                      </p>
                    </div>
                  </label>

                  {pendingPayments.filter(p => p.installmentNo !== nextPending?.installmentNo).map(p => (
                    <label
                      key={p.installmentNo}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${installmentNo === String(p.installmentNo) ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <input
                        type="radio" name="installment" value={p.installmentNo}
                        checked={installmentNo === String(p.installmentNo)}
                        onChange={() => setInstallmentNo(String(p.installmentNo))}
                        className="accent-sky-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">Installment #{p.installmentNo}</p>
                        <p className="text-xs text-slate-500">
                          ${fmt(p.amountDue)} · Due {formatDate(p.dueDate)}
                          {p.paymentStatus === 'OVERDUE' && (
                            <span className="ml-2 text-red-600 font-bold">OVERDUE</span>
                          )}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Amount summary */}
                {selectedInstallment && (
                  <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="text-sm font-semibold text-slate-600">Amount Due</span>
                    <span className="text-xl font-black text-slate-900">${fmt(selectedInstallment.amountDue)}</span>
                  </div>
                )}
              </div>

              {/* Method selector */}
              {!method && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Choose Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setMethod('paypal')}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-[#0070ba] hover:bg-[#f0f8ff] transition-all"
                    >
                      <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-sm tracking-tight">PP</span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">PayPal</span>
                      <span className="text-[11px] text-slate-500 text-center">Redirect to PayPal</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setMethod('card')}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">💳</span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">Credit / Debit Card</span>
                      <span className="text-[11px] text-slate-500 text-center">Visa, Mastercard & more</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* PayPal confirm */}
              {method === 'paypal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setMethod('')} className="text-slate-500 hover:text-slate-800 text-sm font-semibold">← Back</button>
                    <span className="text-slate-600">|</span>
                    <span className="text-sm font-bold text-slate-700">Pay via PayPal</span>
                  </div>
                  <div className="bg-[#f5f7fa] border border-[#d6e4f0] rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                    You'll be redirected to PayPal to complete your payment of <strong>${fmt(selectedInstallment?.amountDue)}</strong> securely.
                    After payment, you'll be brought back to RentSphere automatically.
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex gap-3">
                    <button onClick={() => setMethod('')} disabled={loading}
                      className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50">
                      Cancel
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePayPal} disabled={loading}
                      className="flex-[2] py-3 rounded-2xl bg-[#0070ba] hover:bg-[#003087] text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '→ Continue with PayPal'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Card form */}
              {method === 'card' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setMethod('')} className="text-slate-500 hover:text-slate-800 text-sm font-semibold">← Back</button>
                    <span className="text-slate-600">|</span>
                    <span className="text-sm font-bold text-slate-700">Card Details</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Card Number</label>
                      <input
                        type="text" placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none text-slate-800 font-mono text-base tracking-widest transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cardholder Name</label>
                      <input
                        type="text" placeholder="John Doe"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none text-slate-800 text-base transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Month</label>
                        <input
                          type="text" placeholder="MM"
                          value={expMonth} onChange={e => setExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          maxLength={2}
                          className="w-full px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none text-slate-800 text-center font-mono transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Year (YY)</label>
                        <input
                          type="text" placeholder="YY"
                          value={expYear} onChange={e => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          maxLength={2}
                          className="w-full px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none text-slate-800 text-center font-mono transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">CVV</label>
                        <input
                          type="password" placeholder="•••"
                          value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          className="w-full px-3 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none text-slate-800 text-center font-mono transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                    <span>🔒</span>
                    <span>Your card details are encrypted and never stored.</span>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setMethod('')} disabled={loading}
                      className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50">
                      Cancel
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleCard} disabled={loading || !cardNumber || !cardHolder || !cvv}
                      id={`card-pay-contract-${contract.contractId}`}
                      className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-sky-500/20">
                      {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : `💳 Pay $${fmt(selectedInstallment?.amountDue)}`}
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Installment Status Row ──────────────────────────────── */
function InstallmentRow({ p, isLast }) {
  const cfg = PAY_STATUS_CFG[p.paymentStatus] || PAY_STATUS_CFG.PENDING;
  return (
    <div className={`flex items-center justify-between py-3 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${cfg.bg}`}>
          {cfg.icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Installment #{p.installmentNo}</p>
          <p className="text-xs text-slate-500">Due {formatDate(p.dueDate)}{p.paidDate ? ` · Paid ${formatDate(p.paidDate)}` : ''}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-slate-800">${fmt(p.amountDue)}</p>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.bg}`}>
          {p.paymentStatus}
        </span>
      </div>
    </div>
  );
}

/* ─── Contract Card ───────────────────────────────────────── */
function ContractCard({ contract, onPay, index, role }) {
  const [payments, setPayments]           = useState([]);
  const [showPayments, setShowPayments]   = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState('');

  const cfg       = STATUS_CFG[contract.contractStatus] || STATUS_CFG.PENDING;
  const canPay    = role === 'tenant' && contract.contractStatus === 'ACTIVE';

  const paidCount    = payments.filter(p => p.paymentStatus === 'PAID').length;
  const pendingCount = payments.filter(p => p.paymentStatus === 'PENDING').length;
  const overdueCount = payments.filter(p => p.paymentStatus === 'OVERDUE').length;

  const loadPayments = async () => {
    if (payments.length > 0) { setShowPayments(v => !v); return; }
    setLoadingPayments(true);
    setPaymentsError('');
    try {
      const res = await rentApi.getContractPayments(contract.contractId);
      setPayments(Array.isArray(res.data) ? res.data : []);
      setShowPayments(true);
    } catch (err) {
      setPaymentsError(err.response?.data?.message || 'Failed to load the installment schedule.');
    } finally {
      setLoadingPayments(false);
    }
  };

  const togglePayments = () => {
    if (loadingPayments) return;
    if (payments.length === 0) { loadPayments(); return; }
    setShowPayments(v => !v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card header */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center">
            <span className="text-white text-xs font-black">#{contract.contractId}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Contract</p>
            <p className="text-sm font-black text-slate-900">Property #{contract.propertyId}</p>
          </div>
        </div>
        <span className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 ${cfg.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-4">
        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Detail label="Monthly Rent" value={<span className="font-black text-slate-900">${fmt(contract.rentAmount)}</span>} />
          <Detail label="Duration" value={`${contract.durationMonths} month${contract.durationMonths !== 1 ? 's' : ''}`} />
          <Detail label="Start Date" value={formatDate(contract.startDate)} />
          <Detail label="End Date"   value={formatDate(contract.endDate)} />
        </div>

        {/* Installment summary pills (only after loaded) */}
        {payments.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">{payments.length} installments:</span>
            {paidCount > 0 && (
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                {paidCount} Paid
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                {pendingCount} Pending
              </span>
            )}
            {overdueCount > 0 && (
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                {overdueCount} Overdue
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {payments.length > 0 && (
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
              <span>Payment Progress</span>
              <span>{paidCount}/{payments.length}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${payments.length > 0 ? (paidCount / payments.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        {contract.notes && (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 italic">
            {contract.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={togglePayments}
            disabled={loadingPayments}
            className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
          >
            {loadingPayments ? '...' : showPayments ? 'Hide Schedule' : 'Payment Schedule'}
          </button>

          {canPay && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onPay(contract)}
              id={`pay-contract-${contract.contractId}`}
              className="flex-[1.2] py-2.5 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-700 text-white font-bold text-sm hover:shadow-lg hover:shadow-sky-500/20 transition-all"
            >
              Pay Now
            </motion.button>
          )}
        </div>

        {/* Installment schedule */}
        {paymentsError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
            {paymentsError}
          </div>
        )}
        <AnimatePresence>
          {showPayments && payments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 pt-2"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1 pt-2">All Installments</p>
              <div>
                {payments.map((p, i) => (
                  <InstallmentRow key={p.paymentId} p={p} isLast={i === payments.length - 1} />
                ))}
              </div>
            </motion.div>
          )}
          {showPayments && payments.length === 0 && (
            <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
              No payments scheduled yet.
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{label}</p>
      <p className="font-bold text-slate-700">{value}</p>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
const PAGE_SIZE = 12;

function ContractsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isAdminUser = user?.role === 'admin';

  const [contracts,    setContracts]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [payTarget,    setPayTarget]    = useState(null);
  const [payPayments,  setPayPayments]  = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page,         setPage]         = useState(0);
  const [total,        setTotal]        = useState(0);
  const [summary,      setSummary]      = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin' && user.role !== 'tenant') navigate('/');
  }, [user, navigate]);

  // Admins see every lease in the system, so the page asks the backend for one slice plus a
  // GROUP BY of the totals; a tenant only ever has a handful of their own contracts.
  const fetchContracts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (isAdminUser) {
        const status = filterStatus === 'ALL' ? undefined : filterStatus;
        const [listRes, summaryRes] = await Promise.all([
          rentApi.getManagedContracts({ status, page, size: PAGE_SIZE }),
          rentApi.getContractSummary(),
        ]);
        setContracts(Array.isArray(listRes.data?.items) ? listRes.data.items : []);
        setTotal(Number(listRes.data?.total) || 0);
        setSummary(summaryRes.data && typeof summaryRes.data === 'object' ? summaryRes.data : null);
        return;
      }
      const res  = await rentApi.getAllContracts();
      const list = Array.isArray(res.data) ? res.data : [];
      setContracts(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setTotal(list.length);
      setSummary(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, [isAdminUser, filterStatus, page]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const openPayModal = async (contract) => {
    setError('');
    try {
      const res = await rentApi.getContractPayments(contract.contractId);
      setPayPayments(Array.isArray(res.data) ? res.data : []);
      setPayTarget(contract);
    } catch (err) {
      // Opening the modal with an empty list would render "All installments paid" for a failure.
      setError(err.response?.data?.message || 'Failed to load the payment schedule for this contract.');
    }
  };

  // The backend has already filtered the admin page, so only the tenant view filters locally.
  const filtered    = isAdminUser ? contracts : (filterStatus === 'ALL' ? contracts : contracts.filter(c => c.contractStatus === filterStatus));

  const counts = isAdminUser && summary
    ? { ALL: summary.total ?? 0, ACTIVE: summary.ACTIVE ?? 0, COMPLETED: summary.COMPLETED ?? 0, CANCELLED: summary.CANCELLED ?? 0, PENDING: summary.PENDING ?? 0 }
    : (() => {
        const local = { ALL: contracts.length };
        [...new Set(contracts.map(c => c.contractStatus))].forEach(s => {
          local[s] = contracts.filter(c => c.contractStatus === s).length;
        });
        return local;
      })();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusFilters = [
    { key: 'ALL', label: 'All', icon: '📋' },
    { key: 'ACTIVE',    label: 'Active',    icon: '✅' },
    { key: 'COMPLETED', label: 'Completed', icon: '🏁' },
    { key: 'CANCELLED', label: 'Cancelled', icon: '🚫' },
    { key: 'PENDING',   label: 'Pending',   icon: '⏳' },
  ];

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 pt-32 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div>
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard'}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-sky-700 transition-colors text-sm font-semibold mb-3"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-black text-slate-900 mb-1">Contracts</h1>
              <p className="text-slate-500 font-medium">
                {user?.role === 'admin'
                  ? 'Manage all active leases and track payments.'
                  : 'Your active leases and payment history.'}
              </p>
            </div>
            <div className="flex gap-2 self-start">
              {user?.role === 'admin' && (
                <Link to="/admin/requests" className="py-2.5 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all">
                  📬 Requests
                </Link>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={fetchContracts} disabled={loading}
                className="py-2.5 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                {loading ? '⟳' : '↻'} Refresh
              </motion.button>
            </div>
          </motion.div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {statusFilters.filter(s => s.key === 'ALL' || counts[s.key] > 0).map(s => (
              <button
                key={s.key}
                onClick={() => { setPage(0); setFilterStatus(s.key); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 font-bold text-sm transition-all ${filterStatus === s.key
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full tabular-nums ${filterStatus === s.key ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {(counts[s.key] || 0).toLocaleString('en-US')}
                </span>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl flex items-center gap-3 font-medium">
              <span>⚠️</span><span>{error}</span>
              <button onClick={fetchContracts} className="ml-auto text-sm font-bold underline">Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && contracts.length === 0 && <LoadingSpinner />}

          {/* Empty */}
          {!loading && filtered.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm"
            >
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                {filterStatus === 'ALL' ? 'No contracts yet' : `No ${filterStatus.toLowerCase()} contracts`}
              </h2>
              <p className="text-slate-500 font-medium mb-6">
                {filterStatus === 'ALL'
                  ? 'Contracts are created when a rental request is approved.'
                  : 'Try a different status filter above.'}
              </p>
              {filterStatus === 'ALL' && user?.role === 'admin' && (
                <Link to="/admin/requests" className="inline-block py-3 px-8 rounded-2xl bg-sky-700 text-white font-bold hover:bg-sky-800 transition-all">
                  📬 View Requests
                </Link>
              )}
            </motion.div>
          )}

          {/* Contracts grid */}
          {filtered.length > 0 && (
            <>
              {isAdminUser && (
                <p className="mb-4 text-sm text-slate-500 font-medium">
                  {`Showing ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + contracts.length} of ${total.toLocaleString('en-US')}${filterStatus !== 'ALL' ? ` ${filterStatus.toLowerCase()}` : ''} contracts`}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map((c, i) => (
                  <ContractCard
                    key={c.contractId}
                    contract={c}
                    index={i}
                    role={user?.role}
                    onPay={openPayModal}
                  />
                ))}
              </div>
              {isAdminUser && (
                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                    className="py-2.5 px-5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-500">
                    Page {page + 1} of {totalPages.toLocaleString('en-US')}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page + 1 >= totalPages || loading}
                    className="py-2.5 px-5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {payTarget && (
          <PaymentModal
            contract={payTarget}
            payments={payPayments}
            onClose={() => { setPayTarget(null); setPayPayments([]); }}
            onSuccess={fetchContracts}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

export default ContractsPage;

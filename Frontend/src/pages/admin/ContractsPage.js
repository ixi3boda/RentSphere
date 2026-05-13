import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import { rentApi } from '../../utils/api';


const CONTRACT_STATUS_STYLES = {
  ACTIVE: 'bg-green-100  text-green-700  border border-green-200',
  EXPIRED: 'bg-gray-100   text-gray-600   border border-gray-200',
  TERMINATED: 'bg-red-100    text-red-600    border border-red-200',
};

const CONTRACT_STATUS_ICONS = {
  ACTIVE: '✅',
  EXPIRED: '⏰',
  TERMINATED: '🚫',
};

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}




function PayPalModal({ contract, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const successUrl = `${window.location.origin}/paypal/callback`;
      const cancelUrl = `${window.location.origin}/contracts`;

      const res = await rentApi.createPayPalPayment(contract.contractId, {
        amount: Number(contract.rentAmount),
        currency: 'USD',
        description: `RentSphere Contract #${contract.contractId} — Property #${contract.propertyId}`,
        successUrl,
        cancelUrl,
      });

      const { approvalUrl, paymentId } = res.data || {};
      if (!approvalUrl) throw new Error('No PayPal approval URL received.');


      sessionStorage.setItem('paypal_contract_id', String(contract.contractId));
      sessionStorage.setItem('paypal_payment_id', paymentId || '');


      window.location.href = approvalUrl;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start PayPal payment.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative glass-effect rounded-2xl p-7 max-w-md w-full shadow-2xl z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
        >✕</button>

        { }
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-3xl">💳</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Pay via PayPal</h3>
          <p className="text-gray-500 text-sm mt-1">Contract #{contract.contractId}</p>
        </div>

        { }
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Property</span>
            <Link to={`/properties/${contract.propertyId}`} className="text-rentsphere-teal font-semibold hover:underline">
              #{contract.propertyId}
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tenant ID</span>
            <span className="font-semibold text-gray-800">#{contract.tenantId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="font-semibold text-gray-800">{contract.durationMonths} month{contract.durationMonths !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
            <span className="text-gray-700 font-semibold">Amount</span>
            <span className="text-xl font-bold text-rentsphere-teal">
              ${Number(contract.rentAmount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onClose} disabled={loading}
            className="flex-1 btn-secondary !py-2.5"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handlePay} disabled={loading}
            id={`paypal-pay-contract-${contract.contractId}`}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all hover:shadow-lg disabled:opacity-60"
          >
            {loading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '💳 Pay Now'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}




function ContractCard({ contract, onPay, index, role }) {
  const [payments, setPayments] = useState([]);
  const [showPayments, setShowPayments] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const statusStyle = CONTRACT_STATUS_STYLES[contract.contractStatus] || 'bg-gray-100 text-gray-600';
  const statusIcon = CONTRACT_STATUS_ICONS[contract.contractStatus] || '📋';

  const canPay = role === 'tenant' && ['ACTIVE', 'PENDING_PAYMENT'].includes(contract.contractStatus);

  const togglePayments = async () => {
    if (!showPayments && payments.length === 0) {
      setLoadingPayments(true);
      try {
        const res = await rentApi.getContractPayments(contract.contractId);
        setPayments(res.data || []);
      } catch (err) {
        console.error("Failed to load payments", err);
      } finally {
        setLoadingPayments(false);
      }
    }
    setShowPayments(!showPayments);
  };

  const pendingCount = payments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'OVERDUE').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-effect rounded-2xl p-5 shadow-md flex flex-col gap-4"
    >
      { }
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-gray-400 font-mono">CONTRACT #{contract.contractId}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle}`}>
          {statusIcon} {contract.contractStatus}
        </span>
      </div>

      { }
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Property</p>
          <Link to={`/properties/${contract.propertyId}`} className="font-semibold text-rentsphere-teal hover:underline">
            #{contract.propertyId}
          </Link>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Tenant ID</p>
          <p className="font-semibold text-gray-800">#{contract.tenantId}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Start Date</p>
          <p className="font-semibold text-gray-800">{formatDate(contract.startDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">End Date</p>
          <p className="font-semibold text-gray-800">{formatDate(contract.endDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
          <p className="font-semibold text-gray-800">{contract.durationMonths} month{contract.durationMonths !== 1 ? 's' : ''}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Monthly Rent</p>
          <p className="font-bold text-rentsphere-teal">${Number(contract.rentAmount || 0).toLocaleString()}</p>
        </div>
      </div>

      { }
      {contract.notes && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic border border-gray-100">
          "{contract.notes}"
        </div>
      )}

      { }
      {contract.pdfUrl && (
        <a
          href={contract.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-rentsphere-teal hover:underline font-medium"
        >
          📄 View Contract PDF
        </a>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={togglePayments}
          className="flex-1 btn-secondary !py-2 text-xs font-bold"
        >
          {showPayments ? 'Hide Payments' : `View Payments ${pendingCount > 0 ? `(${pendingCount} Pending)` : ''}`}
        </button>
        {canPay && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => onPay(contract)}
            id={`pay-contract-${contract.contractId}`}
            className="flex-[1.5] bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all hover:shadow-lg"
          >
            💳 Pay Next
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showPayments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 pt-4"
          >
            {loadingPayments ? (
              <div className="text-center py-4 text-xs text-slate-400">Loading payment history...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No payments scheduled yet.</div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Payment Schedule</p>
                {payments.map((p) => (
                  <div key={p.paymentId} className={`flex items-center justify-between p-3 rounded-xl text-xs border ${p.paymentStatus === 'PAID' ? 'bg-emerald-50/50 border-emerald-100' :
                      p.paymentStatus === 'OVERDUE' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-400">#{p.installmentNo}</span>
                      <div>
                        <p className="font-bold text-slate-700">${Number(p.amountDue).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(p.dueDate)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-tighter ${p.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        p.paymentStatus === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {p.paymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}




function ContractsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payTarget, setPayTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');


  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin' && user.role !== 'tenant') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rentApi.getAllContracts();
      const list = Array.isArray(res.data) ? res.data : [];
      setContracts(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const filtered = filterStatus === 'ALL'
    ? contracts
    : contracts.filter((c) => c.contractStatus === filterStatus);

  const counts = {
    ALL: contracts.length,
    ACTIVE: contracts.filter((c) => c.contractStatus === 'ACTIVE').length,
    EXPIRED: contracts.filter((c) => c.contractStatus === 'EXPIRED').length,
    TERMINATED: contracts.filter((c) => c.contractStatus === 'TERMINATED').length,
  };




  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          { }
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div>
              <Link
                to={user?.role === 'admin' ? "/admin/dashboard" : "/tenant/dashboard"}
                className="inline-flex items-center gap-1 text-gray-500 hover:text-rentsphere-teal transition-colors text-sm mb-3"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold gradient-text mb-1">Contracts</h1>
              <p className="text-gray-500">
                {user?.role === 'admin' ? 'All rental contracts — view details and track payments.' : 'Your rental contracts and payment portal.'}
              </p>
            </div>
            <div className="flex gap-2 self-start">
              {user?.role === 'admin' && (
                <Link to="/admin/requests" className="btn-secondary !py-2 !px-4 text-sm">
                  📬 Requests
                </Link>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={fetchContracts}
                disabled={loading}
                className="btn-secondary !py-2 !px-4 text-sm"
              >
                {loading ? '⟳' : '↻'} Refresh
              </motion.button>
            </div>
          </motion.div>

          { }
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8"
          >
            {[
              { key: 'ALL', label: 'All', icon: '📋', color: 'from-gray-500 to-gray-600' },
              { key: 'ACTIVE', label: 'Active', icon: '✅', color: 'from-green-500 to-emerald-500' },
              { key: 'EXPIRED', label: 'Expired', icon: '⏰', color: 'from-gray-400 to-gray-500' },
              { key: 'TERMINATED', label: 'Terminated', icon: '🚫', color: 'from-red-400 to-rose-500' },
            ].map((s) => (
              <motion.div
                key={s.key}
                whileHover={{ scale: 1.04 }}
                onClick={() => setFilterStatus(s.key)}
                className={`glass-effect rounded-2xl p-3 text-center cursor-pointer transition-all shadow-sm
                  ${filterStatus === s.key ? 'ring-2 ring-rentsphere-teal ring-offset-1' : 'hover:shadow-md'}`}
              >
                <div className={`w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-r ${s.color} flex items-center justify-center text-sm`}>
                  {s.icon}
                </div>
                <div className="text-xl font-bold text-gray-800">{counts[s.key]}</div>
                <div className="text-xs text-gray-400 leading-tight">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          { }
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
              <span>⚠️</span><span>{error}</span>
              <button onClick={fetchContracts} className="ml-auto btn-secondary !py-1 !px-3 text-xs">Retry</button>
            </div>
          )}

          {loading && contracts.length === 0 && <LoadingSpinner />}

          {!loading && filtered.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-16 text-center"
            >
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                {filterStatus === 'ALL' ? 'No contracts yet' : `No ${filterStatus.toLowerCase().replace('_', ' ')} contracts`}
              </h2>
              <p className="text-gray-500 mb-5">
                {filterStatus === 'ALL'
                  ? 'Contracts are created when you accept a rental request.'
                  : 'Try a different status filter above.'}
              </p>
              {filterStatus === 'ALL' && (
                <Link to="/admin/requests" className="btn-primary inline-block !py-2.5 !px-8">
                  📬 View Requests
                </Link>
              )}
            </motion.div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filtered.map((c, i) => (
                <ContractCard
                  key={c.contractId}
                  contract={c}
                  index={i}
                  role={user?.role}
                  onPay={setPayTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      { }
      <AnimatePresence>
        {payTarget && (
          <PayPalModal
            contract={payTarget}
            onClose={() => setPayTarget(null)}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

export default ContractsPage;

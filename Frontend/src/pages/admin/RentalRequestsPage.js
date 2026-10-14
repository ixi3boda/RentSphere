








import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import { rentApi } from '../../utils/api';




const PAGE_SIZE = 12;

const STATUS_STYLES = {
  PENDING:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  ACCEPTED:  'bg-green-100  text-green-800  border border-green-200',
  REJECTED:  'bg-red-100    text-red-700    border border-red-200',
  CANCELLED: 'bg-slate-100   text-slate-700   border border-slate-200',
};

const STATUS_ICONS = {
  PENDING:   '⏳',
  ACCEPTED:  '✅',
  REJECTED:  '❌',
  CANCELLED: '🚫',
};

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}




function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1,   opacity: 1, y: 0  }}
        exit={{   scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative card rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onCancel} disabled={loading}
            className="flex-1 btn-secondary !py-2"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onConfirm} disabled={loading}
            className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-60 ${confirmClass}`}
          >
            {loading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}




function RequestCard({ req, onAccept, onReject, actionLoading, index }) {
  const isPending = req.reqStatus === 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ delay: index * 0.05 }}
      className="card rounded-2xl p-5 shadow-md flex flex-col gap-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-600 font-mono">REQ #{req.rentalReqId}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[req.reqStatus] || 'bg-slate-100 text-slate-600'}`}>
          {`${STATUS_ICONS[req.reqStatus] || '•'} ${req.reqStatus}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Property ID</p>
          <p className="font-semibold text-slate-800">
            <Link to={`/properties/${req.propertyId}`} className="text-brand hover:underline">
              #{req.propertyId}
            </Link>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Tenant ID</p>
          <p className="font-semibold text-slate-800">#{req.tenantId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Desired Start</p>
          <p className="font-semibold text-slate-800">{formatDate(req.desiredStart)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Duration</p>
          <p className="font-semibold text-slate-800">{req.desiredMonths} month{req.desiredMonths !== 1 ? 's' : ''}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 uppercase tracking-wide">Submitted</p>
          <p className="font-semibold text-slate-800">{formatDate(req.createdAt)}</p>
        </div>
        {req.reviewedAt && (
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wide">Reviewed At</p>
            <p className="font-semibold text-slate-800">{formatDate(req.reviewedAt)}</p>
          </div>
        )}
      </div>

      {req.message && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 italic border border-slate-100">
          "{req.message}"
        </div>
      )}

      {isPending && (
        <div className="flex gap-3 pt-1">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onAccept(req)}
            disabled={actionLoading === req.rentalReqId}
            id={`accept-request-${req.rentalReqId}`}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-sm transition-all hover:shadow-lg disabled:opacity-60"
          >
            {actionLoading === req.rentalReqId ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '✅ Accept'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onReject(req)}
            disabled={actionLoading === req.rentalReqId}
            id={`reject-request-${req.rentalReqId}`}
            className="flex-1 bg-rose-700 hover:bg-rose-800 text-white font-bold py-2 px-3 rounded-xl text-sm transition-all hover:shadow-lg disabled:opacity-60"
          >
            {actionLoading === req.rentalReqId ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '❌ Reject'}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}




function RentalRequestsPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [actionLoading, setActionLoading] = useState(null); 
  const [toast, setToast]             = useState(null);
  const [confirm, setConfirm]         = useState(null); 
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage]               = useState(0);
  const [total, setTotal]             = useState(0);
  const [counts, setCounts]           = useState(null);

  
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  
  
  
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The list is one page and the cards are server-side totals; the whole table is tens of
      // thousands of rows, far too many to fetch just to render or count it.
      const status = filterStatus === 'ALL' ? undefined : filterStatus;
      const [listRes, summaryRes] = await Promise.all([
        rentApi.getAllRequests({ status, page, size: PAGE_SIZE }),
        rentApi.getRequestSummary(),
      ]);
      setRequests(Array.isArray(listRes.data?.items) ? listRes.data.items : []);
      setTotal(Number(listRes.data?.total) || 0);
      setCounts(summaryRes.data && typeof summaryRes.data === 'object' ? summaryRes.data : null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rental requests.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  
  
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  
  
  
  const handleAccept = (req) => setConfirm({ type: 'accept', req });

  const doAccept = async () => {
    const req = confirm.req;
    setConfirm(null);
    setActionLoading(req.rentalReqId);
    try {
      await rentApi.acceptRequest(req.rentalReqId);
      showToast(`Request #${req.rentalReqId} accepted — contract created.`);
      // Re-read the page: the request may leave the current status filter, and the totals move too.
      await fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept request.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  
  
  
  const handleReject = (req) => setConfirm({ type: 'reject', req });

  const doReject = async () => {
    const req = confirm.req;
    setConfirm(null);
    setActionLoading(req.rentalReqId);
    try {
      await rentApi.rejectRequest(req.rentalReqId);
      showToast(`Request #${req.rentalReqId} rejected.`, 'error');
      await fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  
  
  
  const countsFor = (key) => (counts ? (counts[key] ?? 0).toLocaleString('en-US') : '—');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  
  
  
  return (
    <AnimatedPage>
      <div className="min-h-screen pt-32 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-brand transition-colors text-sm mb-3"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold gradient-text mb-1">Rental Requests</h1>
              <p className="text-slate-500">
                Review and manage incoming rental requests from tenants
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={fetchRequests}
              disabled={loading}
              className="self-start btn-secondary !py-2 !px-5 text-sm"
            >
              {loading ? '⟳ Loading…' : '↻ Refresh'}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
          >
            {[
              { label: 'Total',     count: countsFor('total'),     icon: '📋', tone: 'bg-slate-100 text-slate-700'    },
              { label: 'Pending',   count: countsFor('PENDING'),   icon: '⏳', tone: 'bg-amber-100 text-amber-800'    },
              { label: 'Accepted',  count: countsFor('ACCEPTED'),  icon: '✅', tone: 'bg-emerald-100 text-emerald-800'},
              { label: 'Rejected',  count: countsFor('REJECTED'),  icon: '❌', tone: 'bg-rose-100 text-rose-800'      },
              { label: 'Cancelled', count: countsFor('CANCELLED'), icon: '🚫', tone: 'bg-slate-100 text-slate-600'    },
            ].map((s) => (
              <motion.button
                key={s.label}
                type="button"
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                  setPage(0);
                  setFilterStatus(s.label === 'Total' ? 'ALL' : s.label.toUpperCase());
                }}
                aria-pressed={filterStatus === (s.label === 'Total' ? 'ALL' : s.label.toUpperCase())}
                className={`card rounded-2xl p-4 text-center cursor-pointer transition-all shadow-sm
                  ${filterStatus === (s.label === 'Total' ? 'ALL' : s.label.toUpperCase())
                    ? 'ring-2 ring-brand ring-offset-1'
                    : 'hover:shadow-md'}`}
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${s.tone} flex items-center justify-center text-lg`}>
                  {s.icon}
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{s.count.toLocaleString('en-US')}</div>
                <div className="text-xs text-slate-600">{s.label}</div>
              </motion.button>
            ))}
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchRequests} className="ml-auto btn-secondary !py-1 !px-3 text-xs">Retry</button>
            </div>
          )}

          {loading && requests.length === 0 && <LoadingSpinner />}

          {!loading && requests.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card rounded-2xl p-16 text-center"
            >
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                {filterStatus === 'ALL' ? 'No requests yet' : `No ${filterStatus.toLowerCase()} requests`}
              </h2>
              <p className="text-slate-500">
                {filterStatus === 'ALL'
                  ? 'Rental requests from tenants will appear here.'
                  : 'Try selecting a different filter above.'}
              </p>
            </motion.div>
          )}

          {requests.length > 0 && (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {`Showing ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + requests.length} of ${total.toLocaleString('en-US')}${filterStatus !== 'ALL' ? ` ${filterStatus.toLowerCase()}` : ''} requests`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {requests.map((req, i) => (
                  <RequestCard
                    key={req.rentalReqId}
                    req={req}
                    index={i}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="btn-secondary !py-2 !px-5 text-sm disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {page + 1} of {totalPages.toLocaleString('en-US')}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page + 1 >= totalPages || loading}
                  className="btn-secondary !py-2 !px-5 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            title={confirm.type === 'accept' ? 'Accept Request?' : 'Reject Request?'}
            message={
              confirm.type === 'accept'
                ? `Accept request #${confirm.req.rentalReqId}? A contract will be automatically created.`
                : `Reject request #${confirm.req.rentalReqId}? The tenant will be notified.`
            }
            confirmLabel={confirm.type === 'accept' ? '✅ Yes, Accept' : '❌ Yes, Reject'}
            confirmClass={
              confirm.type === 'accept'
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-rose-700 hover:bg-rose-800 text-white'
            }
            onConfirm={confirm.type === 'accept' ? doAccept : doReject}
            onCancel={() => setConfirm(null)}
            loading={false}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: 40  }}
            className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-white font-semibold
              ${toast.type === 'error'
                ? 'bg-rose-700'
                : 'bg-emerald-700'}`}
          >
            {toast.type === 'error' ? '❌ ' : '✅ '}{toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

export default RentalRequestsPage;

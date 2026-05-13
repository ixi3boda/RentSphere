import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProperty } from '../../context/PropertyContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import StatsCard from '../../components/StatsCard';
import { rentApi } from '../../utils/api';

const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartment',
  house:     'House',
  studio:    'Studio',
  villa:     'Villa',
  office:    'Office',
  other:     'Other',
};

const STATUS_COLORS = {
  available:   'bg-emerald-50 text-emerald-600 border-emerald-100',
  rented:      'bg-blue-50 text-blue-600 border-blue-100',
  maintenance: 'bg-amber-50 text-amber-600 border-amber-100',
};

function QuickAction({ to, icon, label, variant = 'secondary' }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Link
        to={to}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm border
          ${variant === 'primary'
            ? 'bg-zen-500 text-white border-zen-400 hover:shadow-lg shadow-zen-500/20'
            : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
          }`}
      >
        <span className="text-base">{icon}</span>
        {label}
      </Link>
    </motion.div>
  );
}

function AdminPropertyCard({ property, onDelete, index }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 soft-shadow group"
    >
      <div className="relative h-48 overflow-hidden">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-4xl">🏠</div>
        )}
        <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md ${STATUS_COLORS[property.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
          {property.status}
        </span>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{property.title}</h3>
        <p className="text-slate-400 text-sm mb-4 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          {property.location}
        </p>
        
        <div className="flex items-center justify-between mb-6 pt-4 border-t border-slate-50">
          <span className="text-2xl font-black text-slate-900">${Number(property.price || 0).toLocaleString()}<span className="text-sm font-medium text-slate-400">/mo</span></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{PROPERTY_TYPE_LABELS[property.propertyType]}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => navigate(`/admin/properties/edit/${property.id}`)} className="flex-1 btn-secondary !py-2.5 !px-3 text-xs">Edit</button>
          <button onClick={() => onDelete(property)} className="flex-1 bg-red-50 text-red-500 font-bold py-2.5 px-3 text-xs rounded-xl hover:bg-red-100 transition-colors">Delete</button>
        </div>
      </div>
    </motion.div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const { properties, loading: propsLoading, error: propsError, fetchOwnerProperties, deleteProperty } = useProperty();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (user && user.role !== 'admin') navigate('/'); }, [user, navigate]);
  useEffect(() => { fetchOwnerProperties(); }, [fetchOwnerProperties]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const [requestsRes, contractsRes] = await Promise.all([rentApi.getAllRequests(), rentApi.getAllContracts()]);
      const requests  = Array.isArray(requestsRes.data)  ? requestsRes.data  : [];
      const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : [];
      setStats({
        totalProperties: properties.length,
        pendingRequests: requests.filter((r) => r.reqStatus === 'PENDING').length,
        activeContracts: contracts.filter((c) => c.contractStatus === 'ACTIVE').length,
      });
    } catch (err) { setStatsError('Failed to load dashboard stats.'); }
    finally { setStatsLoading(false); }
  }, [properties]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await deleteProperty(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (result.success) showToast('Property deleted successfully.');
    else showToast(result.error || 'Failed to delete property.', 'error');
  };

  const statCards = [
    { icon: '🏠', label: 'Properties', value: properties.length, accent: 'teal' },
    { icon: '📬', label: 'Pending', value: stats?.pendingRequests ?? '—', accent: 'orange' },
    { icon: '📋', label: 'Active', value: stats?.activeContracts ?? '—', accent: 'green' },
    { icon: '🔧', label: 'Maintenance', value: properties.filter((p) => p.status === 'maintenance').length, accent: 'yellow' },
  ];

  return (
    <AnimatedPage>
      <div className="bg-slate-50/50 min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
            <div>
              <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">Admin Console.</h1>
              <p className="text-slate-500 font-medium">Managing RentSphere inventory and requests</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <QuickAction to="/admin/properties/new" icon="+" label="Add New" variant="primary" />
              <QuickAction to="/admin/requests" icon="📬" label="Requests" />
              <QuickAction to="/contracts" icon="📋" label="Contracts" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {statCards.map((s, i) => (
              <StatsCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} loading={statsLoading && i > 0} index={i} />
            ))}
          </div>

          {/* Listings Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-1">My Listings</h2>
              <p className="text-slate-400 font-medium text-sm">{properties.length} properties managed by you</p>
            </div>
            <Link to="/admin/properties/new" className="text-zen-600 font-bold hover:underline">Add Property →</Link>
          </div>

          {/* Main Content */}
          {propsLoading && properties.length === 0 ? (
            <LoadingSpinner />
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 soft-shadow">
              <div className="text-6xl mb-6">🏘️</div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No Properties Yet</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Start building your portfolio by adding your first property.</p>
              <Link to="/admin/properties/new" className="btn-primary !px-8">+ Add First Property</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((prop, i) => (
                <AdminPropertyCard key={prop.id} property={prop} onDelete={setDeleteTarget} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">🗑️</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Property?</h3>
                <p className="text-slate-500 mb-8 font-medium">Are you sure you want to remove <span className="text-slate-900 font-bold">"{deleteTarget.title}"</span>? This cannot be undone.</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
                  <button onClick={handleDeleteConfirm} className="bg-red-500 text-white font-bold rounded-2xl py-3 hover:bg-red-600 shadow-lg shadow-red-200">
                    {deleteLoading ? '...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-8 right-8 z-[110] px-8 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center space-x-3 ${toast.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

export default AdminDashboard;

// src/pages/owner/OwnerDashboard.js
//
// RS-14 — Owner Dashboard UI
// Displays key stats (Total Properties, Pending Requests, Active Contracts),
// quick action buttons, and the full property management list.

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProperty } from '../../context/PropertyContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import StatsCard from '../../components/StatsCard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROPERTY_TYPE_LABELS = {
  apartment: '🏢 Apartment',
  house:     '🏡 House',
  studio:    '🏠 Studio',
  villa:     '🏰 Villa',
  office:    '🏬 Office',
  other:     '📦 Other',
};

const STATUS_COLORS = {
  available:   'bg-green-100 text-green-700',
  rented:      'bg-blue-100  text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
};


// ---------------------------------------------------------------------------
// Quick Action Button — consistent with btn-primary / btn-secondary pattern
// ---------------------------------------------------------------------------
function QuickAction({ to, icon, label, variant = 'secondary' }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Link
        to={to}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm
          ${variant === 'primary'
            ? 'bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange text-white hover:shadow-md'
            : 'glass-effect text-gray-700 hover:shadow-md hover:text-rentsphere-teal border border-white/30'
          }`}
      >
        <span className="text-base">{icon}</span>
        {label}
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------
function DeleteModal({ property, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative glass-effect rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Delete Property?</h3>
          <p className="text-gray-600 mb-1">Are you sure you want to delete this property?</p>
          {property && (
            <p className="text-gray-800 font-semibold mb-4">"{property.title}"</p>
          )}
          <p className="text-sm text-red-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={loading}
              className="flex-1 btn-secondary py-2 px-4"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                </div>
              ) : 'Yes, Delete'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Property Row Card (owner-specific — has Edit / Delete actions)
// ---------------------------------------------------------------------------
function OwnerPropertyCard({ property, onDelete, index }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="glass-effect rounded-2xl overflow-hidden shadow-lg card-hover group"
    >
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-rentsphere-teal/20 to-rentsphere-orange/20 overflow-hidden">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-40">🏠</span>
          </div>
        )}
        <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[property.status] || 'bg-gray-100 text-gray-600'}`}>
          {property.status?.charAt(0).toUpperCase() + property.status?.slice(1) || 'Unknown'}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 truncate mb-1">{property.title}</h3>
        <p className="text-sm text-gray-500 mb-1">📍 {property.location || 'No location set'}</p>
        <p className="text-sm text-gray-500 mb-3">{PROPERTY_TYPE_LABELS[property.propertyType] || '📦 Other'}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold gradient-text">
            ${Number(property.price || 0).toLocaleString()}
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </span>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/owner/properties/edit/${property.id}`)}
            id={`edit-property-${property.id}`}
            className="flex-1 btn-secondary !py-2 !px-3 text-sm"
          >
            ✏️ Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onDelete(property)}
            id={`delete-property-${property.id}`}
            className="flex-1 bg-red-50 text-red-600 font-semibold py-2 px-3 text-sm rounded-lg transition-all duration-300 hover:bg-red-100 hover:shadow-md"
          >
            🗑️ Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Owner Dashboard — RS-14
// ---------------------------------------------------------------------------
function OwnerDashboard() {
  const { user } = useAuth();
  const { properties, loading: propsLoading, error: propsError, fetchOwnerProperties, deleteProperty } = useProperty();
  const navigate = useNavigate();

  // Dashboard stats (fetched separately from the property list)
  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // -------------------------------------------------------------------------
  // Redirect non-owners
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (user && user.role !== 'owner') navigate('/');
  }, [user, navigate]);

  // -------------------------------------------------------------------------
  // Fetch property list (existing PropertyContext)
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchOwnerProperties();
  }, [fetchOwnerProperties]);

  // -------------------------------------------------------------------------
  // Fetch dashboard stats from API (RS-14)
  // -------------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      // Stats are derived from the property list (no dedicated stats endpoint)
      setStats({
        totalProperties: properties.length,
        pendingRequests: 0,
        activeContracts: properties.filter((p) => p.status === 'rented').length,
      });
    } catch (err) {
      setStatsError('Failed to load dashboard stats.');
    } finally {
      setStatsLoading(false);
    }
  }, [properties]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Once properties are loaded, update the totalProperties stat from the real count
  useEffect(() => {
    if (!propsLoading && stats) {
      setStats((prev) => ({ ...prev, totalProperties: properties.length }));
    }
  }, [propsLoading, properties.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteClick  = (property) => setDeleteTarget(property);
  const handleDeleteCancel = () => setDeleteTarget(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await deleteProperty(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (result.success) {
      showToast('Property deleted successfully.');
    } else {
      showToast(result.error || 'Failed to delete property.', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // Stat cards config (derives from fetched stats + properties)
  // -------------------------------------------------------------------------
  const statCards = [
    {
      icon: '🏠',
      label: 'Total Properties',
      value: stats?.totalProperties ?? properties.length,
      subLabel: `${properties.filter((p) => p.status === 'available').length} available`,
      accent: 'teal',
    },
    {
      icon: '📬',
      label: 'Pending Requests',
      value: stats?.pendingRequests ?? '—',
      subLabel: 'Awaiting your response',
      accent: 'orange',
    },
    {
      icon: '📋',
      label: 'Active Contracts',
      value: stats?.activeContracts ?? '—',
      subLabel: 'Currently rented',
      accent: 'green',
    },
    {
      icon: '🔧',
      label: 'Under Maintenance',
      value: properties.filter((p) => p.status === 'maintenance').length,
      subLabel: 'Being serviced',
      accent: 'yellow',
    },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* ---------------------------------------------------------------- */}
          {/* Header                                                            */}
          {/* ---------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-1">Owner Dashboard</h1>
                <p className="text-gray-500">
                  Welcome back, <span className="font-semibold text-gray-700">{user?.name || 'Owner'}</span> — here's your overview
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                <QuickAction
                  to="/owner/properties/new"
                  icon="+"
                  label="Add Property"
                  variant="primary"
                />
                <QuickAction
                  to="/owner/dashboard"
                  icon="📋"
                  label="Manage Listings"
                />
                <QuickAction
                  to="/properties"
                  icon="🏘️"
                  label="Browse All"
                />
              </div>
            </div>
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* Stats error                                                       */}
          {/* ---------------------------------------------------------------- */}
          {statsError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3"
            >
              <span>⚠️</span>
              <span>{statsError}</span>
              <button onClick={fetchStats} className="ml-auto btn-secondary !py-1 !px-3 text-xs">
                Retry
              </button>
            </motion.div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Stats cards — RS-14                                               */}
          {/* ---------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            {statCards.map((s, i) => (
              <StatsCard
                key={s.label}
                icon={s.icon}
                label={s.label}
                value={s.value}
                subLabel={s.subLabel}
                accent={s.accent}
                loading={statsLoading && i > 0} // first card uses live property count
                index={i}
              />
            ))}
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* Section divider                                                   */}
          {/* ---------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800">My Listings</h2>
              <p className="text-sm text-gray-400">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} managed</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/owner/properties/new"
                id="add-property-btn"
                className="btn-primary inline-flex items-center gap-2 !py-2 !px-5 text-sm"
              >
                <span>+</span> Add Property
              </Link>
            </motion.div>
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* Property list error                                               */}
          {/* ---------------------------------------------------------------- */}
          {propsError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"
            >
              {propsError}
            </motion.div>
          )}

          {/* Loading */}
          {propsLoading && properties.length === 0 && <LoadingSpinner />}

          {/* Empty state */}
          {!propsLoading && properties.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-16 text-center"
            >
              <div className="text-6xl mb-4">🏘️</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Properties Yet</h2>
              <p className="text-gray-500 mb-6">Start by adding your first property listing.</p>
              <Link to="/owner/properties/new" className="btn-primary inline-block !py-2.5 !px-8">
                + Add Your First Property
              </Link>
            </motion.div>
          )}

          {/* Property grid */}
          {properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop, i) => (
                <OwnerPropertyCard
                  key={prop.id}
                  property={prop}
                  onDelete={handleDeleteClick}
                  index={i}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Delete Modal                                                          */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            property={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------- */}
      {/* Toast notification                                                    */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-white font-semibold
              ${toast.type === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange'
              }`}
          >
            {toast.type === 'error' ? '❌ ' : '✅ '}{toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}

export default OwnerDashboard;

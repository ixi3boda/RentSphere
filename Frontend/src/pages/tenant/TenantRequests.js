// src/pages/tenant/TenantRequests.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import { rentApi, propertyApi } from '../../utils/api';
import { mapPropertyToFrontend } from '../../utils/mappers';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

function TenantRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (user && user.role !== 'tenant') {
      navigate('/');
    }
  }, [user, navigate]);

  const tenantId = useMemo(() => Number(user?.id), [user?.id]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await propertyApi.getAll();
      const mapped = (Array.isArray(res.data) ? res.data : []).map(mapPropertyToFrontend);
      setProperties(mapped);
    } catch (err) {
      console.error('Failed to load properties:', err);
      setProperties([]);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rentApi.getAllRequests();
      const all = Array.isArray(res.data) ? res.data : [];
      const mine = all
        .filter((request) => Number(request.tenantId) === tenantId)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRequests(mine);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your rental requests.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      fetchRequests();
      fetchProperties();
    }
  }, [tenantId, fetchRequests, fetchProperties]);

  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-1">Rental Requests</h1>
              <p className="text-gray-500">Track updates for requests sent from property pages.</p>
            </div>
            <Link to="/tenant/dashboard" className="btn-secondary inline-flex !py-2 !px-5 text-sm self-start">
              Back to dashboard
            </Link>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Requests ({requests.length})</h2>

            {loading ? (
              <LoadingSpinner />
            ) : requests.length === 0 ? (
              <div className="glass-effect rounded-2xl p-10 text-center text-gray-500">
                No requests yet. Open any property and use Request Rental.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const propertyName = properties.find((p) => Number(p.id) === Number(request.propertyId))?.title || `Property #${request.propertyId}`;
                  return (
                    <div key={request.rentalReqId} className="glass-effect rounded-2xl p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="font-semibold text-gray-800">{propertyName}</div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[request.reqStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {request.reqStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div><span className="font-semibold">Start:</span> {request.desiredStart || '—'}</div>
                        <div><span className="font-semibold">Months:</span> {request.desiredMonths || '—'}</div>
                        <div><span className="font-semibold">Offered:</span> {request.offeredPrice ? `$${Number(request.offeredPrice).toLocaleString()}` : '—'}</div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600"><span className="font-semibold">Created:</span> {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}</div>
                      <p className="mt-3 text-gray-700">{request.message || 'No message provided.'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}

export default TenantRequests;

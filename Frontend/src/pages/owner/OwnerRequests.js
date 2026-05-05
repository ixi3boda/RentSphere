// src/pages/owner/OwnerRequests.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import { propertyApi, rentApi } from '../../utils/api';
import { mapPropertyToFrontend } from '../../utils/mappers';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

function OwnerRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [ownerPropertyMap, setOwnerPropertyMap] = useState({});

  const ownerId = useMemo(() => Number(user?.id), [user?.id]);

  useEffect(() => {
    if (user && user.role !== 'owner') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchOwnerRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [propsRes, reqRes] = await Promise.all([
        propertyApi.getAll(),
        rentApi.getAllRequests(),
      ]);

      const mapped = (Array.isArray(propsRes.data) ? propsRes.data : [])
        .map(mapPropertyToFrontend)
        .filter((property) => Number(property.ownerId) === ownerId);

      const propertyMap = mapped.reduce((acc, property) => {
        acc[String(property.id)] = property;
        return acc;
      }, {});

      const ownerPropertyIds = new Set(Object.keys(propertyMap));

      const ownerRequests = (Array.isArray(reqRes.data) ? reqRes.data : [])
        .filter((request) => ownerPropertyIds.has(String(request.propertyId)))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setOwnerPropertyMap(propertyMap);
      setRequests(ownerRequests);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load owner requests.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (ownerId) fetchOwnerRequests();
  }, [ownerId, fetchOwnerRequests]);

  const handleAction = async (requestId, action) => {
    setActingId(requestId);
    setError('');
    try {
      if (action === 'accept') {
        await rentApi.acceptRequest(requestId);
      } else {
        await rentApi.rejectRequest(requestId);
      }
      await fetchOwnerRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = requests.filter((request) => request.reqStatus === 'PENDING').length;

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
              <h1 className="text-4xl font-bold gradient-text mb-1">Owner Requests</h1>
              <p className="text-gray-500">Review incoming rental requests for your listings.</p>
            </div>
            <Link to="/owner/dashboard" className="btn-secondary inline-flex !py-2 !px-5 text-sm self-start">
              Back to dashboard
            </Link>
          </motion.div>

          <div className="mb-6 glass-effect rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">Pending Approval</div>
              <div className="text-3xl font-bold text-rentsphere-orange">{pendingCount}</div>
            </div>
            <div className="text-sm text-gray-500">Total requests: {requests.length}</div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : requests.length === 0 ? (
            <div className="glass-effect rounded-2xl p-10 text-center text-gray-500">
              No requests for your properties yet.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const property = ownerPropertyMap[String(request.propertyId)];
                const isPending = request.reqStatus === 'PENDING';
                return (
                  <div key={request.rentalReqId} className="glass-effect rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="font-semibold text-gray-800">{property?.title || `Property #${request.propertyId}`}</div>
                        <div className="text-sm text-gray-500">Tenant #{request.tenantId}</div>
                      </div>
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

                    {isPending && (
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleAction(request.rentalReqId, 'accept')}
                          disabled={actingId === request.rentalReqId}
                          className="btn-primary !py-2 !px-5 disabled:opacity-60"
                        >
                          {actingId === request.rentalReqId ? 'Working...' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(request.rentalReqId, 'reject')}
                          disabled={actingId === request.rentalReqId}
                          className="btn-secondary !py-2 !px-5 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default OwnerRequests;

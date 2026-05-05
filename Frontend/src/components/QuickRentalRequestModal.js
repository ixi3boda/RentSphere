import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rentApi } from '../utils/api';

function QuickRentalRequestModal({ isOpen, property, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    desiredStart: '',
    desiredMonths: 1,
    offeredPrice: '',
    message: '',
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm((prev) => ({
      ...prev,
      desiredStart: '',
      desiredMonths: 1,
      offeredPrice: property?.price ? Number(property.price).toFixed(2) : '',
      message: '',
    }));
  }, [isOpen, property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.desiredStart < today) {
      setError('Desired start date must be today or later.');
      setLoading(false);
      return;
    }

    try {
      await rentApi.createRequest({
        propertyId: property.propertyId || property.id,
        desiredStart: form.desiredStart,
        desiredMonths: Number(form.desiredMonths),
        offeredPrice: Number(form.offeredPrice),
        message: form.message,
      });

      // Reset form
      setForm({
        desiredStart: '',
        desiredMonths: 1,
        offeredPrice: '',
        message: '',
      });

      // Notify parent
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          >
            <div className="glass-effect rounded-2xl shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Request This Rental</h2>
                    <p className="text-sm text-gray-500 mt-1">{property?.title || property?.name}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Desired Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Desired Start Date
                  </label>
                  <input
                    type="date"
                    name="desiredStart"
                    value={form.desiredStart}
                    onChange={handleChange}
                    min={today}
                    required
                    className="input-field w-full"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    name="desiredMonths"
                    min="1"
                    value={form.desiredMonths}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Offered Price (per month)
                  </label>
                  <input
                    type="number"
                    name="offeredPrice"
                    min="0.01"
                    step="0.01"
                    value={form.offeredPrice}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Message to Owner <span className="text-xs text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    name="message"
                    rows="3"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell the owner a bit about yourself..."
                    className="input-field w-full resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 btn-secondary !py-2.5 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary !py-2.5 disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>

              {/* Success Message */}
              {/* Optional: Show success feedback inline before closing */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default QuickRentalRequestModal;

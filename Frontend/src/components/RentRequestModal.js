





import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rentApi } from '../utils/api';


const todayIso = () => new Date().toISOString().split('T')[0];

function RentRequestModal({ property, onClose }) {
  const [form, setForm] = useState({
    desiredStart: todayIso(),
    desiredMonths: 12,
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.desiredStart) return 'Please choose a desired start date.';
    if (new Date(form.desiredStart) < new Date(todayIso()))
      return 'Start date cannot be in the past.';
    const months = Number(form.desiredMonths);
    if (!months || months < 1 || months > 24)
      return 'Duration must be between 1 and 24 months.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      await rentApi.createRequest({
        propertyId:    Number(property.id),
        message:       form.message || '',
        desiredStart:  form.desiredStart,           
        desiredMonths: Number(form.desiredMonths),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative glass-effect rounded-2xl p-7 max-w-lg w-full shadow-2xl z-10"
      >
        {}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
        >
          ✕
        </button>

        {}
        {}
        {}
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-rentsphere-teal to-green-400 flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Submitted!</h3>
            <p className="text-gray-500 mb-6">
              Your rental request for <span className="font-semibold text-gray-700">"{property?.title}"</span> has been sent.
              The admin will review it shortly.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="btn-primary !py-2.5 !px-8"
            >
              Done
            </motion.button>
          </motion.div>
        ) : (
          <>
            {}
            <div className="mb-6">
              <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Request Rental</h3>
              <p className="text-gray-500 text-sm mt-1 truncate">
                {property?.title}
                {property?.location && (
                  <span className="ml-1 text-gray-400">· {property.location}</span>
                )}
              </p>
              {property?.price && (
                <p className="text-rentsphere-teal font-bold text-lg mt-1">
                  ${Number(property.price).toLocaleString()}<span className="text-gray-400 text-sm font-normal">/mo</span>
                </p>
              )}
            </div>

            {}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {}
            <form onSubmit={handleSubmit} className="space-y-5">
              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="desiredStart" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Desired Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="desiredStart"
                    type="date"
                    name="desiredStart"
                    value={form.desiredStart}
                    onChange={handleChange}
                    min={todayIso()}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="desiredMonths" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="desiredMonths"
                    type="number"
                    name="desiredMonths"
                    value={form.desiredMonths}
                    onChange={handleChange}
                    min={1}
                    max={24}
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">1 – 24 months</p>
                </div>
              </div>

              {}
              {property?.price && form.desiredMonths > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-gradient-to-r from-rentsphere-teal/10 to-rentsphere-orange/10 border border-rentsphere-teal/20"
                >
                  <p className="text-sm text-gray-600">
                    Estimated total:{' '}
                    <span className="font-bold text-rentsphere-teal">
                      ${(Number(property.price) * Number(form.desiredMonths)).toLocaleString()}
                    </span>
                    {' '}for <strong>{form.desiredMonths}</strong> month{form.desiredMonths !== 1 ? 's' : ''}
                  </p>
                </motion.div>
              )}

              {}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Introduce yourself and share any special requirements…"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length}/500</p>
              </div>

              {}
              <div className="flex gap-3 pt-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </span>
                  ) : (
                    '📋 Submit Request'
                  )}
                </motion.button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default RentRequestModal;

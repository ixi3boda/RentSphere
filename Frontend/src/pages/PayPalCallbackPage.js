// src/pages/PayPalCallbackPage.js
//
// Handles the PayPal return redirect after a user approves a payment.
//
// PayPal redirects to this page with:
//   ?paymentId=PAY-xxx&PayerID=yyy
//
// We stored the contractId in sessionStorage before the redirect.
// We call POST /api/rent/contracts/{contractId}/paypal/execute and show result.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { rentApi } from '../utils/api';

function PayPalCallbackPage() {
  const navigate = useNavigate();

  const [status, setStatus]   = useState('processing'); // 'processing' | 'success' | 'error' | 'cancelled'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const paymentId   = params.get('paymentId');
    const payerId     = params.get('PayerID'); // PayPal uses 'PayerID' (capital Y)
    const contractId  = sessionStorage.getItem('paypal_contract_id');

    // Clean up session keys immediately
    sessionStorage.removeItem('paypal_contract_id');
    sessionStorage.removeItem('paypal_payment_id');

    // Cancelled flow — PayPal redirects with no PayerID when user cancels
    if (!payerId) {
      setStatus('cancelled');
      setMessage('You cancelled the PayPal payment. No charge was made.');
      return;
    }

    if (!paymentId || !contractId) {
      setStatus('error');
      setMessage('Missing payment information. Please try again from the contracts page.');
      return;
    }

    // Execute the payment
    (async () => {
      try {
        await rentApi.executePayPalPayment(Number(contractId), paymentId, payerId);
        setStatus('success');
        setMessage(`Payment for Contract #${contractId} was completed successfully!`);
        // Auto-redirect after 4 s
        setTimeout(() => navigate('/admin/contracts'), 4000);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          err.message ||
          'Payment execution failed. Please contact support.'
        );
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  const stateConfig = {
    processing: {
      icon:      '⏳',
      gradient:  'from-blue-400 to-blue-600',
      title:     'Processing Payment…',
      sub:       'Please wait while we confirm your payment with PayPal.',
      spinner:   true,
    },
    success: {
      icon:      '✅',
      gradient:  'from-green-400 to-emerald-500',
      title:     'Payment Successful!',
      sub:       message,
      spinner:   false,
    },
    cancelled: {
      icon:      '🚫',
      gradient:  'from-gray-400 to-gray-500',
      title:     'Payment Cancelled',
      sub:       message,
      spinner:   false,
    },
    error: {
      icon:      '⚠️',
      gradient:  'from-red-400 to-rose-500',
      title:     'Payment Failed',
      sub:       message,
      spinner:   false,
    },
  };

  const cfg = stateConfig[status];

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1,   opacity: 1, y: 0  }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="glass-effect rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
            className={`w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-r ${cfg.gradient} flex items-center justify-center text-4xl shadow-lg`}
          >
            {cfg.icon}
          </motion.div>

          {/* Spinner ring (processing only) */}
          {cfg.spinner && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 mx-auto mb-5 border-4 border-blue-200 border-t-blue-500 rounded-full"
            />
          )}

          <h1 className="text-2xl font-bold text-gray-800 mb-2">{cfg.title}</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">{cfg.sub}</p>

          {/* Success note */}
          {status === 'success' && (
            <p className="text-sm text-gray-400 mb-6">Redirecting to contracts in a moment…</p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/admin/contracts"
              className="btn-primary !py-2.5 !px-7"
            >
              📋 View Contracts
            </Link>
            {status !== 'success' && (
              <Link
                to="/admin/dashboard"
                className="btn-secondary !py-2.5 !px-7"
              >
                Dashboard
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default PayPalCallbackPage;

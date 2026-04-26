// src/components/AnimatedPage.js
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Install framer-motion first: npm install framer-motion

export const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin-slow rounded-full h-12 w-12 border-4 border-rentsphere-teal border-t-transparent"></div>
    </div>
  );
};

export const AnimatedButton = ({ children, onClick, loading = false, type = "button" }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      type={type}
      className="btn-primary w-full relative overflow-hidden group"
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
        </div>
      ) : (
        <span className="relative z-10">{children}</span>
      )}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
};

export const FloatingCard = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={`glass-effect rounded-2xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};
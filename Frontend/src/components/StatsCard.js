// src/components/StatsCard.js
//
// RS-14 — Reusable dashboard statistics card.
//
// Props:
//   icon        {string}   – emoji or text icon
//   label       {string}   – card title (e.g. "Total Properties")
//   value       {number|string} – the main metric value
//   subLabel    {string}   – optional helper text below the value
//   accent      {string}   – colour variant: 'teal' | 'orange' | 'green' | 'blue' | 'yellow' | 'red'
//   loading     {boolean}  – show skeleton when true
//   index       {number}   – stagger animation index

import React from 'react';
import { motion } from 'framer-motion';

// Map accent names → Tailwind classes (avoids dynamic class purge issues)
const ACCENT_STYLES = {
  teal:   { icon: 'bg-rentsphere-teal/10 text-rentsphere-teal',   value: 'text-rentsphere-teal'  },
  orange: { icon: 'bg-rentsphere-orange/10 text-rentsphere-orange', value: 'text-rentsphere-orange' },
  green:  { icon: 'bg-green-100 text-green-600',                   value: 'text-green-600'         },
  blue:   { icon: 'bg-blue-100 text-blue-600',                     value: 'text-blue-600'          },
  yellow: { icon: 'bg-yellow-100 text-yellow-600',                 value: 'text-yellow-600'        },
  red:    { icon: 'bg-red-100 text-red-600',                       value: 'text-red-600'           },
};

function StatsCard({ icon, label, value, subLabel, accent = 'teal', loading = false, index = 0 }) {
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.teal;

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="glass-effect rounded-2xl p-5 card-hover"
    >
      {/* Icon bubble */}
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-2xl mb-4 ${style.icon}`}>
        {icon}
      </div>

      {/* Value */}
      <div className={`text-3xl font-bold mb-1 ${style.value}`}>
        {value ?? '—'}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-gray-700">{label}</div>

      {/* Sub-label */}
      {subLabel && (
        <div className="text-xs text-gray-400 mt-0.5">{subLabel}</div>
      )}
    </motion.div>
  );
}

export default StatsCard;

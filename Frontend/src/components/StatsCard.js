import React from 'react';
import { motion } from 'framer-motion';

const ACCENT_STYLES = {
  // Every accent sits at -700/-800: on a *-50 tint the -500/-600 shades only reach 2.8-3.6:1.
  sky:      { icon: 'bg-sky-50 text-sky-700 border-sky-100',   value: 'text-slate-900'  },
  amber:    { icon: 'bg-amber-50 text-amber-800 border-amber-100', value: 'text-slate-900' },
  emerald:  { icon: 'bg-emerald-50 text-emerald-700 border-emerald-100', value: 'text-slate-900' },
  blue:     { icon: 'bg-blue-50 text-blue-700 border-blue-100', value: 'text-slate-900' },
  gold:     { icon: 'bg-yellow-50 text-yellow-800 border-yellow-100', value: 'text-slate-900' },
};

function StatsCard({ icon, label, value, subLabel, accent = 'sky', loading = false, index = 0 }) {
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.sky;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 soft-shadow animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-6" />
        <div className="h-10 bg-slate-100 rounded-xl w-1/3 mb-4" />
        <div className="h-4 bg-slate-100 rounded-md w-2/3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="bg-white rounded-2xl p-8 border border-slate-100 soft-shadow hover:shadow-xl transition-all duration-300 group"
    >
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-3xl mb-6 border transition-transform group-hover:scale-110 ${style.icon}`}>
        {icon}
      </div>

      <div className="flex flex-col">
        <span className="text-4xl font-black text-slate-900 mb-1 leading-none tracking-tight tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('en-US') : (value ?? '—')}
        </span>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</span>
      </div>

      {subLabel && (
        <div className="text-xs font-medium text-slate-600 mt-2 flex items-center">
          <span className="w-1 h-1 bg-sky-400 rounded-full mr-2" />
          {subLabel}
        </div>
      )}
    </motion.div>
  );
}

export default StatsCard;

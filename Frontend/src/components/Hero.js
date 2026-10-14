import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import { PROPERTY_TYPE_OPTIONS } from '../utils/propertyTypes';

function Hero() {
  const navigate = useNavigate();

  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [stats, setStats] = useState(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    propertyApi.getMarketplaceStats()
      .then((res) => { if (!cancelled) setStats(res.data); })
      .catch(() => { if (!cancelled) setStatsFailed(true); });
    propertyApi.getCities()
      .then((res) => { if (!cancelled && Array.isArray(res.data)) setCities(res.data); })
      .catch(() => { if (!cancelled) setCities([]); });
    return () => { cancelled = true; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (type) params.set('type', type);
    if (maxPrice) params.set('maxPrice', maxPrice);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="relative min-h-[92vh] flex items-center overflow-hidden pt-28 pb-16 bg-slate-900 text-white">
      {/* Glow Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-sky-500 rounded-full blur-[160px] opacity-40"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[0%] left-[-10%] w-[650px] h-[650px] bg-indigo-600 rounded-full blur-[180px] opacity-30"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-slate-800/80 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-full mb-8 shadow-glass"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-xs font-bold text-sky-400 tracking-widest uppercase">Renting platform with contracts and instalments</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              Find & Lease Premier <br />
              <span className="gradient-text-inverse">Properties Effortlessly.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl font-medium leading-relaxed">
              RentSphere turns an approved rental request into a signed-off contract with its own monthly instalment schedule, then tracks every payment against it.
            </p>

            {/* Quick Search Widget */}
            <form onSubmit={handleSearchSubmit} className="bg-slate-800/90 backdrop-blur-2xl p-4 sm:p-6 rounded-2xl border border-slate-700/80 shadow-2xl mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Location</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:border-sky-400 outline-none">
                    <option value="">All Locations</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Property Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:border-sky-400 outline-none">
                    <option value="">All Types</option>
                    {PROPERTY_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Max Price ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:border-sky-400 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {stats
                    ? `${stats.availableListings.toLocaleString()} of ${stats.totalListings.toLocaleString()} listings available now`
                    : statsFailed ? 'Live counts unavailable — search still works' : 'Loading listings…'}
                </span>
                <button type="submit" className="btn-primary text-sm px-8 py-3 shadow-glow-sky">
                  Search Properties →
                </button>
              </div>
            </form>
            
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800">
              <StatItem label="Total Listings" value={stats ? stats.totalListings.toLocaleString() : '—'} />
              <StatItem label="Available Now" value={stats ? stats.availableListings.toLocaleString() : '—'} />
              <StatItem label="Active Leases" value={stats ? stats.activeLeases.toLocaleString() : '—'} />
            </div>
          </motion.div>

          {/* Right Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/60 bg-slate-800">
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000" 
                alt="Illustration: residential property" 
                className="w-full h-[580px] object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-8 left-8 right-8 surface-dark p-6 rounded-3xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="badge-gold">How renting works</span>
                  <Link to="/properties" className="btn-primary text-xs !py-2.5">
                    Browse listings
                  </Link>
                </div>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="text-sky-400 font-black">01</span>
                    <span className="text-slate-300">Send a rental request with your start date and term</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-sky-400 font-black">02</span>
                    <span className="text-slate-300">Approval creates the contract and its monthly instalment schedule</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-sky-400 font-black">03</span>
                    <span className="text-slate-300">Pay each instalment by PayPal or card until the lease completes</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Badge floating */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -left-6 surface-dark p-4 rounded-2xl border border-slate-700 shadow-2xl z-20"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center text-xl">🔔</div>
                <div>
                  <p className="text-white font-bold text-sm">Status notifications</p>
                  <p className="text-slate-400 text-xs">Requests, approvals and payments</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-2xl font-black text-white leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

export default Hero;
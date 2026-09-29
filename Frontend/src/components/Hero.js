import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

function Hero() {
  const navigate = useNavigate();

  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

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
              <span className="text-xs font-bold text-sky-400 tracking-widest uppercase">Verified Real Estate Agency Platform</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              Find & Lease Premier <br />
              <span className="gradient-text">Properties Effortlessly.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl font-medium leading-relaxed">
              RentSphere connects discerning tenants with verified landlords through automated digital lease agreements, escrow protection, and 24/7 concierge support.
            </p>

            {/* Quick Search Widget */}
            <form onSubmit={handleSearchSubmit} className="bg-slate-800/90 backdrop-blur-2xl p-4 sm:p-6 rounded-[2rem] border border-slate-700/80 shadow-2xl mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Location</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:border-sky-400 outline-none">
                    <option value="">All Locations</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Alexandria">Alexandria</option>
                    <option value="Giza">Giza</option>
                    <option value="Riyadh">Riyadh</option>
                    <option value="Dubai">Dubai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Property Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:border-sky-400 outline-none">
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="duplex">Duplex</option>
                    <option value="office">Office</option>
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
                <span className="text-xs font-semibold text-slate-400">⚡ Over 500+ Luxury Spaces Ready for Occupancy</span>
                <button type="submit" className="btn-accent text-sm px-8 py-3 shadow-glow-sky">
                  Search Properties →
                </button>
              </div>
            </form>
            
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-800">
              <StatItem label="Managed Assets" value="$12.4M+" />
              <StatItem label="Active Leases" value="1,450+" />
              <StatItem label="Tenant Satisfaction" value="99.6%" />
            </div>
          </motion.div>

          {/* Right Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-700/60 bg-slate-800">
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000" 
                alt="Luxury Real Estate Property" 
                className="w-full h-[580px] object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-8 left-8 right-8 glass-dark p-6 rounded-3xl border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge-gold">👑 Agency Featured Listing</span>
                  <span className="text-emerald-400 font-bold text-sm">Verified 100%</span>
                </div>
                <h3 className="text-white text-2xl font-extrabold mb-1">The Grand Horizon Estate</h3>
                <p className="text-slate-400 text-xs mb-4">Downtown Marina • 4 Beds • 3 Baths • 320 sqm</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-2xl font-black text-white">$4,200</span>
                    <span className="text-slate-400 text-xs"> / month</span>
                  </div>
                  <Link to="/properties" className="btn-primary text-xs !py-2.5">
                    View Details
                  </Link>
                </div>
              </div>
            </div>

            {/* Badge floating */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -left-6 glass-dark p-4 rounded-2xl border border-slate-700 shadow-2xl z-20"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center text-xl">📄</div>
                <div>
                  <p className="text-white font-bold text-sm">Digital Leases</p>
                  <p className="text-slate-400 text-xs">Instant PDF Generation</p>
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
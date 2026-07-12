import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import PropertyCard from '../../components/PropertyCard';
import { propertyApi, rentApi } from '../../utils/api';
import { mapPropertyToFrontend } from '../../utils/mappers';
import { getRecentlyViewed } from '../../utils/recentlyViewed';

function TenantDashboard() {
  const { user, initializing } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!user) { 
        setFavorites([]); 
        setContracts([]);
        return; 
      }
      const [favRes, conRes] = await Promise.all([
        propertyApi.getFavorites(),
        rentApi.getAllContracts()
      ]);
      
      const favList = Array.isArray(favRes.data) ? favRes.data : [];
      setFavorites(favList.map((item) => mapPropertyToFrontend(item.propertyDetails)).filter(Boolean));
      
      const conList = Array.isArray(conRes.data) ? conRes.data : [];
      setContracts(conList);
    } catch (err) {
      if (err.response?.status === 401) {
        setFavorites([]);
        setContracts([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load your dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    if (!initializing) {
      fetchDashboardData(); 
    }
  }, [fetchDashboardData, initializing]);

  useEffect(() => { setRecentlyViewed(getRecentlyViewed()); }, []);

  const favoriteIds = new Set(favorites.map((favorite) => String(favorite.id)));

  return (
    <AnimatedPage>
      <div className="bg-slate-50/50 min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">Dashboard.</h1>
              <p className="text-slate-500 font-medium">
                Welcome back, <span className="text-zen-600">{user?.name || user?.email?.split('@')[0]}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/profile" className="btn-secondary !py-3">Edit Profile</Link>
              <Link to="/properties" className="btn-primary !py-3 shadow-zen-500/20">Find New Home</Link>
            </div>
          </div>

          {/* Stats / Banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
             <div className="relative overflow-hidden rounded-[3rem] p-10 lg:p-14 bg-slate-900 text-white shadow-2xl">
                <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-zen-500 rounded-full blur-[120px] opacity-20" />
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <span className="inline-block px-4 py-1 rounded-full bg-zen-500/20 text-zen-400 text-[10px] font-bold uppercase tracking-widest mb-6 border border-zen-500/30">Tenant Perks</span>
                    <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Manage your <span className="text-zen-400">RentSphere</span> experience in one place.</h2>
                    <p className="text-slate-400 text-lg mb-8">Keep track of your saved listings, view recent activity, and manage your rental contracts with ease.</p>
                    <div className="flex items-center space-x-12">
                      <StatBlock label="Favorites" value={favorites.length} />
                      <StatBlock label="Viewed" value={recentlyViewed.length} />
                      <StatBlock label="Contracts" value={contracts.length} />
                    </div>
                  </div>
                  <div className="hidden md:flex justify-center">
                     <div className="w-64 h-64 bg-zen-500/10 rounded-full border border-white/5 flex items-center justify-center text-[100px] animate-float">🏠</div>
                  </div>
                </div>
             </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] font-medium flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Favorites Section */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-1">Your Favorites</h2>
                <p className="text-slate-400 font-medium text-sm">Saved for quick access later</p>
              </div>
              {favorites.length > 0 && <Link to="/favorites" className="text-zen-600 font-bold hover:underline">View All →</Link>}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"><LoadingSpinner /></div>
            ) : favorites.length === 0 ? (
              <EmptyState icon="🤍" title="No favorites yet" desc="Heart some properties and they'll show up here." action="/properties" actionText="Browse Properties" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {favorites.map((prop, i) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    index={i}
                    initialFavorited={favoriteIds.has(String(prop.id))}
                    onFavoriteToggle={(next) => {
                      if (!next) setFavorites(prev => prev.filter(item => String(item.id) !== String(prop.id)));
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recently Viewed */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-1">Recently Viewed</h2>
                <p className="text-slate-400 font-medium text-sm">Stored locally in your browser</p>
              </div>
              {recentlyViewed.length > 0 && (
                <button onClick={() => { setRecentlyViewed([]); localStorage.removeItem('rentsphere_recently_viewed'); }} className="text-red-400 font-bold hover:text-red-500 transition-colors">
                  Clear History
                </button>
              )}
            </div>

            {recentlyViewed.length === 0 ? (
              <EmptyState icon="🕒" title="History is empty" desc="Your recently visited listings will appear here." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentlyViewed.map((prop, i) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    index={i}
                    initialFavorited={favoriteIds.has(String(prop.id))}
                    onFavoriteToggle={(next) => {
                      setFavorites(prev => {
                        if (next) return [...prev, prop];
                        return prev.filter(item => String(item.id) !== String(prop.id));
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AnimatedPage>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="group">
      <p className="text-3xl lg:text-4xl font-black text-white group-hover:text-zen-400 transition-colors">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, desc, action, actionText }) {
  return (
    <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 soft-shadow">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">{desc}</p>
      {action && <Link to={action} className="btn-primary !px-8">{actionText}</Link>}
    </div>
  );
}

export default TenantDashboard;
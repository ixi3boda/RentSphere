// src/pages/tenant/TenantDashboard.js

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import PropertyCard from '../../components/PropertyCard';
import { propertyApi } from '../../utils/api';
import { mapPropertyToFrontend } from '../../utils/mappers';
import { getRecentlyViewed } from '../../utils/recentlyViewed';

function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await propertyApi.getFavorites();
      const list = Array.isArray(res.data) ? res.data : [];
      setFavorites(
        list
          .map((item) => mapPropertyToFrontend(item.propertyDetails))
          .filter(Boolean),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your favorites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'tenant') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  const favoriteIds = new Set(favorites.map((favorite) => String(favorite.id)));

  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-1">Tenant Dashboard</h1>
              <p className="text-gray-500">
                Welcome back, <span className="font-semibold text-gray-700">{user?.name || 'Tenant'}</span>
              </p>
            </div>

            <Link to="/properties" className="btn-primary inline-flex self-start !py-2 !px-5">
              Browse properties
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-10"
          >
            <motion.div
              animate={{ y: [0, -4, 0], scale: [1, 1.01, 1] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative overflow-hidden rounded-3xl p-7 sm:p-8 text-white shadow-2xl"
              style={{
                background:
                  'linear-gradient(120deg, rgba(13,148,136,1) 0%, rgba(59,130,246,1) 45%, rgba(251,146,60,1) 100%)',
              }}
            >
              <motion.div
                animate={{ x: ['-120%', '120%'] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-1/3 bg-white/15 blur-2xl"
              />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-white/80 text-sm font-semibold tracking-wide uppercase mb-1">
                    Your Properties Catalog
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                    Discover your next home
                  </h2>
                  <p className="text-white/85 mt-2 max-w-2xl">
                    Browse the full live catalog, then save the listings you love.
                  </p>
                </div>

                <motion.div
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-6xl sm:text-7xl self-end sm:self-auto"
                >
                  🏘️
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Favorites: {favorites.length} saved</h2>
              <p className="text-sm text-gray-400">Saved properties pulled directly from the database</p>
            </div>
            <Link to="/favorites" className="btn-secondary inline-flex !py-2 !px-5 text-sm">
              View all favorites
            </Link>
          </motion.div>

          {loading ? (
            <LoadingSpinner />
          ) : favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-16 text-center"
            >
              <div className="text-6xl mb-4">🤍</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No favorites yet</h2>
              <p className="text-gray-500 mb-6">
                Tap the heart on any property to save it, and it will appear here.
              </p>
              <Link to="/properties" className="btn-primary inline-block !py-2.5 !px-8">
                Browse Properties
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  initialFavorited={favoriteIds.has(String(property.id))}
                  onFavoriteToggle={(next) => {
                    setFavorites((prev) => {
                      if (next) return prev;
                      return prev.filter((item) => String(item.id) !== String(property.id));
                    });
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="flex items-center justify-between mt-14 mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Recently Viewed: {recentlyViewed.length} properties</h2>
              <p className="text-sm text-gray-400">Your latest property visits, stored in this browser</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRecentlyViewed([]);
                localStorage.removeItem('rentsphere_recently_viewed');
              }}
              className="btn-secondary inline-flex !py-2 !px-5 text-sm"
            >
              Clear history
            </button>
          </motion.div>

          {recentlyViewed.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-12 text-center"
            >
              <div className="text-5xl mb-3">🕘</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No recent views yet</h3>
              <p className="text-gray-500">Open a property detail page and it will show up here.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyViewed.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  initialFavorited={favorites.some((item) => String(item.id) === String(property.id))}
                  onFavoriteToggle={(next) => {
                    setFavorites((prev) => {
                      if (next) {
                        const exists = prev.some((item) => String(item.id) === String(property.id));
                        return exists ? prev : [property, ...prev];
                      }
                      return prev.filter((item) => String(item.id) !== String(property.id));
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default TenantDashboard;
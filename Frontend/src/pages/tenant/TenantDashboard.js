// src/pages/tenant/TenantDashboard.js

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AnimatedPage, LoadingSpinner } from '../../components/AnimatedPage';
import PropertyCard from '../../components/PropertyCard';
import StatsCard from '../../components/StatsCard';
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            <StatsCard
              icon="🤍"
              label="Saved Favorites"
              value={favorites.length}
              subLabel="Properties you bookmarked"
              accent="orange"
            />
            <StatsCard
              icon="🕘"
              label="Recently Viewed"
              value={recentlyViewed.length}
              subLabel="Properties you opened"
              accent="blue"
            />
            <StatsCard
              icon="🏘️"
              label="Browse Listings"
              value="Live"
              subLabel="Open the property catalog"
              accent="teal"
            />
            <StatsCard
              icon="👤"
              label="Profile"
              value={user?.name || 'Tenant'}
              subLabel="Your account overview"
              accent="blue"
            />
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
              <h2 className="text-2xl font-bold text-gray-800">Your Favorites</h2>
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
              <h2 className="text-2xl font-bold text-gray-800">Recently Viewed</h2>
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
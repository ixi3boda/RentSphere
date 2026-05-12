

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedPage, LoadingSpinner } from '../components/AnimatedPage';
import PropertyCard from '../components/PropertyCard';
import { propertyApi } from '../utils/api';
import { mapPropertyToFrontend } from '../utils/mappers';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
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
      setError(err.response?.data?.message || 'Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <AnimatedPage>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">My Favorites</h1>
              <p className="text-gray-500">
                Saved properties you can revisit anytime.
              </p>
            </div>
            <Link to="/properties" className="btn-primary inline-flex self-start !py-2 !px-5">
              Browse more
            </Link>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              {error}
            </div>
          )}

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
                Tap the heart on any property to save it here.
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
                  initialFavorited
                  onFavoriteToggle={() => fetchFavorites()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default Favorites;
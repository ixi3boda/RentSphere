// src/components/PropertyCard.js
//
// RS-10 — Reusable property summary card.
// Used by: PropertyList (tenant browse) and OwnerDashboard (owner view).
//
// Props:
//   property  {object}   – property data object
//   index     {number}   – stagger animation index
//   actions   {node}     – optional bottom-row action buttons (owner CRUD, etc.)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Shared label maps (kept in sync with PropertyForm constants)
// ---------------------------------------------------------------------------
const PROPERTY_TYPE_LABELS = {
  apartment: '🏢 Apartment',
  house:     '🏡 House',
  studio:    '🏠 Studio',
  villa:     '🏰 Villa',
  office:    '🏬 Office',
  other:     '📦 Other',
};

// ---------------------------------------------------------------------------
// PropertyCard
// ---------------------------------------------------------------------------
function PropertyCard({ property, index = 0, actions }) {
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(false);

  const handleCardClick = (e) => {
    // Don't navigate when clicking buttons inside the card
    if (e.target.closest('button')) return;
    navigate(`/properties/${property.id}`);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    setFavorited((prev) => !prev);
    // TODO: POST /api/favorites when backend is ready
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      onClick={handleCardClick}
      id={`property-card-${property.id}`}
      className="glass-effect rounded-2xl overflow-hidden shadow-lg card-hover group cursor-pointer"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Image                                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative h-48 bg-gradient-to-br from-rentsphere-teal/20 to-rentsphere-orange/20 overflow-hidden">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30">🏠</span>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          id={`favorite-${property.id}`}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow transition-transform hover:scale-110 active:scale-95"
        >
          <span className={`text-base transition-colors ${favorited ? 'text-red-500' : 'text-gray-400'}`}>
            {favorited ? '❤️' : '🤍'}
          </span>
        </button>

        {/* Status badge */}
        {property.status && (
          <span
            className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full
              ${property.status === 'available'   ? 'bg-green-100 text-green-700'  :
                property.status === 'rented'      ? 'bg-blue-100  text-blue-700'   :
                property.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100  text-gray-600'}`}
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-5">
        {/* Type label */}
        <p className="text-xs text-gray-400 mb-1">
          {PROPERTY_TYPE_LABELS[property.propertyType] ?? '📦 Other'}
        </p>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 truncate mb-1 group-hover:text-rentsphere-teal transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
          <span>📍</span>
          <span className="truncate">{property.location || 'No location set'}</span>
        </p>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">
            ${Number(property.price || 0).toLocaleString()}
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </span>

          {/* "View" hint — only shown when no custom actions provided */}
          {!actions && (
            <span className="text-xs text-rentsphere-teal font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              View details →
            </span>
          )}
        </div>

        {/* Optional actions slot (e.g. owner Edit / Delete buttons) */}
        {actions && <div className="mt-4">{actions}</div>}
      </div>
    </motion.div>
  );
}

export default PropertyCard;

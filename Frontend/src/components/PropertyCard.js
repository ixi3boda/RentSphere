import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';

const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartment',
  house:     'House',
  studio:    'Studio',
  villa:     'Villa',
  office:    'Office',
  other:     'Other',
};

function PropertyCard({ property, index = 0, actions, initialFavorited = false, onFavoriteToggle }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(`/properties/${property.id}`);
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'rented': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={handleCardClick}
      id={`property-card-${property.id}`}
      className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 soft-shadow hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = 'flex'); }}
          />
        ) : null}
        <div className="w-full h-full bg-slate-100 flex items-center justify-center" style={{ display: property.images?.[0] ? 'none' : 'flex' }}>
          <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <FavoriteButton
            propertyId={property.id}
            initialFavorited={initialFavorited}
            onToggle={onFavoriteToggle}
            compact
          />
          
          {property.status && (
            <span className={`backdrop-blur-md border px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusStyles(property.status)}`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </span>
          )}
        </div>

        {/* Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className="flex gap-4 text-white text-xs font-medium">
             <span className="flex items-center gap-1">🛏️ {property.numRooms || 0} Rooms</span>
             <span className="flex items-center gap-1">📐 {property.areaSqm || 0} m²</span>
           </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zen-500 bg-zen-50 px-2 py-0.5 rounded-md">
            {PROPERTY_TYPE_LABELS[property.propertyType] || 'Property'}
          </span>
          <div className="flex items-center text-amber-400 text-xs">
            ★ <span className="text-slate-400 ml-1 font-semibold">4.8</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1 truncate group-hover:text-zen-600 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center text-slate-400 text-sm mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{property.location || property.city || 'Location unavailable'}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div>
            <span className="text-2xl font-black text-slate-900">${Number(property.price || 0).toLocaleString()}</span>
            <span className="text-slate-400 text-sm font-medium"> /mo</span>
          </div>
          
          <motion.div
            whileHover={{ x: 5 }}
            className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-zen-500 group-hover:text-white transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </motion.div>
        </div>

        {actions && <div className="mt-4 pt-4 border-t border-slate-50">{actions}</div>}
      </div>
    </motion.div>
  );
}

export default PropertyCard;



import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function FavoriteButton({
  propertyId,
  initialFavorited = false,
  onToggle,
  className = '',
  showLabel = false,
  compact = false,
  disabled = false,
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [favorited, setFavorited] = useState(Boolean(initialFavorited));
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFavorited(Boolean(initialFavorited));
  }, [initialFavorited]);

  const handleClick = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (loading || disabled) return;

    setLoading(true);
    setFailed(false);
    try {
      await propertyApi.favorite(propertyId);
      setFavorited((prev) => {
        const next = !prev;
        if (onToggle) onToggle(next);
        return next;
      });
    } catch {
      // The heart has not moved, so say so instead of leaving a silent console error.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        failed ? 'Saving this favorite failed, try again'
          : favorited ? 'Remove from favorites' : 'Add to favorites'
      }
      aria-pressed={favorited}
      disabled={loading || disabled}
      title={disabled ? 'Could not check your saved listings yet' : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full border transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-wait
        ${compact ? 'w-9 h-9' : 'px-4 py-2'}
        ${failed
          ? 'border-amber-400 bg-amber-50 text-amber-800'
          : favorited
          ? 'border-red-300 bg-red-50 text-red-700 shadow-sm'
          : 'border-slate-200 bg-white/70 text-slate-500 hover:border-red-300 hover:text-red-500'}
        ${className}`}
    >
      <span className={`transition-transform ${favorited ? 'scale-110' : ''}`}>
        {failed ? '⚠️' : favorited ? '❤️' : '🤍'}
      </span>
      {showLabel && <span className="text-sm font-semibold">{failed ? 'Try again' : favorited ? 'Saved' : 'Save'}</span>}
    </button>
  );
}

export default FavoriteButton;
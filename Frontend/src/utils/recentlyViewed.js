// src/utils/recentlyViewed.js

const RECENTLY_VIEWED_KEY = 'rentsphere_recently_viewed';
const MAX_RECENTLY_VIEWED = 6;

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function getRecentlyViewed() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
  const list = safeParse(raw || '[]', []);
  return Array.isArray(list) ? list : [];
}

export function setRecentlyViewed(properties) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(properties.slice(0, MAX_RECENTLY_VIEWED)));
}

export function recordRecentlyViewed(property) {
  if (typeof window === 'undefined' || !property?.id) return;

  const nextItem = {
    ...property,
    viewedAt: new Date().toISOString(),
  };

  const filtered = getRecentlyViewed().filter((item) => String(item?.id) !== String(property.id));
  filtered.unshift(nextItem);
  setRecentlyViewed(filtered);
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}
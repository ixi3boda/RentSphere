const RECENTLY_VIEWED_KEY = 'rentsphere_recently_viewed';
const MAX_RECENTLY_VIEWED = 6;

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Strip base64 image data before saving — images are the primary cause of
// QuotaExceededError since each base64 string can be 100-500 KB.
// We keep only lightweight metadata; images will simply show a placeholder
// when re-loaded from recently viewed.
function stripImages(property) {
  if (!property) return property;
  const { images, coverPic, ...rest } = property;
  return {
    ...rest,
    images: [],   // cleared — not persisted
    coverPic: null,
  };
}

export function getRecentlyViewed() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
  const list = safeParse(raw || '[]', []);
  return Array.isArray(list) ? list : [];
}

export function setRecentlyViewed(properties) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify(properties.slice(0, MAX_RECENTLY_VIEWED))
    );
  } catch (err) {
    // If still over quota (shouldn't happen after stripping), clear and retry once
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      try {
        localStorage.setItem(
          RECENTLY_VIEWED_KEY,
          JSON.stringify(properties.slice(0, 2))
        );
      } catch {
        // Give up gracefully — recently viewed is non-critical
      }
    }
  }
}

export function recordRecentlyViewed(property) {
  if (typeof window === 'undefined' || !property?.id) return;

  // Strip large binary fields before persisting
  const lightweight = stripImages(property);

  const nextItem = {
    ...lightweight,
    viewedAt: new Date().toISOString(),
  };

  const filtered = getRecentlyViewed().filter(
    (item) => String(item?.id) !== String(property.id)
  );
  filtered.unshift(nextItem);
  setRecentlyViewed(filtered);
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}
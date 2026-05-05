// src/utils/mappers.js
//
// Field translators between the Spring Boot backend DTOs and the
// frontend component's expected property shape.
// ---------------------------------------------------------------------------

/**
 * Backend GET /api/properties/all  →  List<PropertyDetails>
 * PropertyDetails = { property: Property, propertyImages: string[], coverPic: string }
 * Property        = { propertyId, ownerId, propertyType, title, propertyDescription,
 *                     pricePerMonth, city, district, address, latitude, longitude,
 *                     numRooms, areaSqm, isAvailable, createdAt, updatedAt }
 *
 * Maps a single PropertyDetails object to the frontend shape used by all pages.
 */
export function mapPropertyToFrontend(pd) {
  if (!pd) return null;
  const p = pd.property || {};

  // Build a readable location string from city + district + address
  const locationParts = [p.city, p.district, p.address].filter(Boolean);
  const location = locationParts.join(', ') || '—';

  // Derive status from isAvailable flag
  const status = p.isAvailable === false ? 'rented' : 'available';

  // Combine cover pic + image list (cover first, de-duplicated)
  const images = [];
  if (pd.coverPic) images.push(pd.coverPic);
  if (Array.isArray(pd.propertyImages)) {
    pd.propertyImages.forEach((img) => {
      if (img && img !== pd.coverPic) images.push(img);
    });
  }

  return {
    id:           String(p.propertyId),
    title:        p.title || '',
    description:  p.propertyDescription || '',
    price:        p.pricePerMonth != null ? Number(p.pricePerMonth) : 0,
    location,
    city:         p.city || '',
    district:     p.district || '',
    address:      p.address || '',
    propertyType: (p.propertyType || 'other').toLowerCase(),
    status,
    numRooms:     p.numRooms ?? null,
    areaSqm:      p.areaSqm != null ? Number(p.areaSqm) : null,
    latitude:     p.latitude != null ? Number(p.latitude) : null,
    longitude:    p.longitude != null ? Number(p.longitude) : null,
    ownerId:      p.ownerId ?? null,
    images,
    coverPic:     pd.coverPic || (images[0] || null),
    createdAt:    p.createdAt || null,
    updatedAt:    p.updatedAt || null,
  };
}

/**
 * Frontend PropertyForm fields  →  Backend Property DTO body
 * Used by POST /api/properties/add
 * Field names match the backend Property DTO (camelCase).
 */
export function mapFormToBackend(formData) {
  return {
    propertyType:        (formData.propertyType || '').toUpperCase(), // backend CHECK: APARTMENT|STUDIO|VILLA|DUPLEX|OFFICE|SHOP|WAREHOUSE
    title:               formData.title || '',
    propertyDescription: formData.description || '',
    pricePerMonth:       formData.price ? Number(formData.price) : null,
    city:                formData.city || '',
    district:            formData.district || '',
    address:             formData.address || formData.location || '',  // address is NOT NULL in DB
    latitude:            formData.latitude  ? Number(formData.latitude)  : null,
    longitude:           formData.longitude ? Number(formData.longitude) : null,
    numRooms:            formData.numRooms  ? Number(formData.numRooms)  : null,
    areaSqm:             formData.areaSqm   ? Number(formData.areaSqm)  : null,
    isAvailable:         formData.isAvailable !== false,
  };
}

/**
 * Backend User DTO → frontend user shape stored in AuthContext / localStorage
 */
export function mapUserToFrontend(u) {
  if (!u) return null;
  return {
    id:     u.user_id,
    email:  u.email,
    name:   u.full_name || u.username || u.email,
    username: u.username,
    // Normalise role: backend stores 'ADMIN' | 'USER', frontend uses 'owner' | 'tenant'
    role:   u.role_name === 'ADMIN' ? 'owner' : 'tenant',
    role_name: u.role_name,
    avatar: u.avatar_url || null,
    phone:  u.mobile_number || null,
    active: u.is_active,
  };
}

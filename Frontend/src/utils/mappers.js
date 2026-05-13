






export function mapPropertyToFrontend(pd) {
  if (!pd) return null;
  const p = pd.property || {};

  const locationParts = [p.city, p.district, p.address].filter(Boolean);
  const location = locationParts.join(', ') || '—';

  const status = p.isAvailable === false ? 'rented' : 'available';

  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    return `/uploads/${url}`;
  };

  const images = [];
  if (pd.coverPic) images.push(formatImageUrl(pd.coverPic));
  if (Array.isArray(pd.propertyImages)) {
    pd.propertyImages.forEach((img) => {
      const formatted = formatImageUrl(img);
      if (formatted && !images.includes(formatted)) images.push(formatted);
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
    coverPic:     formatImageUrl(pd.coverPic) || (images[0] || null),
    createdAt:    p.createdAt || null,
    updatedAt:    p.updatedAt || null,
  };
}


export function mapFormToBackend(formData) {
  return {
    propertyType:        (formData.propertyType || '').toUpperCase(), 
    title:               formData.title || '',
    propertyDescription: formData.propertyDescription || '',          
    pricePerMonth:       formData.pricePerMonth ? Number(formData.pricePerMonth) : null, 
    city:                formData.city || '',
    district:            formData.district || '',
    address:             formData.address || '',                       
    latitude:            formData.latitude  ? Number(formData.latitude)  : null,
    longitude:           formData.longitude ? Number(formData.longitude) : null,
    numRooms:            formData.numRooms  ? Number(formData.numRooms)  : null,
    areaSqm:             formData.areaSqm   ? Number(formData.areaSqm)   : null,
    isAvailable:         formData.isAvailable !== false,
  };
}


export function mapUserToFrontend(u) {
  if (!u) return null;
  const activeValue =
    u.is_active ?? u.isActive ?? u.active ?? false;

  return {
    id:        u.user_id,
    email:     u.email,
    name:      u.full_name || u.username || u.email,
    username:  u.username,
    role:      u.role_name === 'ADMIN' ? 'admin' : u.role_name === 'TENANT' ? 'tenant' : 'visitor',
    role_name: u.role_name,
    avatar:    u.avatar_url || null,
    phone:     u.mobile_number || null,
    active:    Boolean(activeValue),
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}
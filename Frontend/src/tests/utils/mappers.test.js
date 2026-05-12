




import { mapPropertyToFrontend, mapFormToBackend, mapUserToFrontend } from '../../utils/mappers';



describe('mapPropertyToFrontend', () => {
  const rawPD = {
    property: {
      propertyId: 42,
      ownerId: 1,
      propertyType: 'APARTMENT',
      title: 'Test Apt',
      propertyDescription: 'Great place',
      pricePerMonth: 1200,
      city: 'Riyadh',
      district: 'Al Olaya',
      address: 'Main St',
      latitude: 24.688,
      longitude: 46.722,
      numRooms: 3,
      areaSqm: 110,
      isAvailable: true,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00',
    },
    propertyImages: ['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg'],
    coverPic: 'https://cdn.test/a.jpg',
  };

  it('maps id as string', () => {
    const result = mapPropertyToFrontend(rawPD);
    expect(result.id).toBe('42');
  });

  it('maps title correctly', () => {
    expect(mapPropertyToFrontend(rawPD).title).toBe('Test Apt');
  });

  it('maps price as number', () => {
    expect(mapPropertyToFrontend(rawPD).price).toBe(1200);
    expect(typeof mapPropertyToFrontend(rawPD).price).toBe('number');
  });

  it('maps propertyType to lowercase', () => {
    expect(mapPropertyToFrontend(rawPD).propertyType).toBe('apartment');
  });

  it('maps isAvailable:true to status "available"', () => {
    expect(mapPropertyToFrontend(rawPD).status).toBe('available');
  });

  it('maps isAvailable:false to status "rented"', () => {
    const unavailable = { ...rawPD, property: { ...rawPD.property, isAvailable: false } };
    expect(mapPropertyToFrontend(unavailable).status).toBe('rented');
  });

  it('builds location from city + district + address', () => {
    expect(mapPropertyToFrontend(rawPD).location).toBe('Riyadh, Al Olaya, Main St');
  });

  it('uses coverPic as first image and avoids duplicates', () => {
    const result = mapPropertyToFrontend(rawPD);
    expect(result.images[0]).toBe('https://cdn.test/a.jpg');
    expect(result.images.length).toBe(2); 
  });

  it('defaults coverPic to first image if null', () => {
    const noCover = { ...rawPD, coverPic: null };
    const result = mapPropertyToFrontend(noCover);
    expect(result.coverPic).toBe('https://cdn.test/a.jpg');
  });

  it('returns null for null input', () => {
    expect(mapPropertyToFrontend(null)).toBeNull();
  });

  it('handles missing property sub-object', () => {
    const minimal = { property: {}, propertyImages: [], coverPic: null };
    const result = mapPropertyToFrontend(minimal);
    expect(result.title).toBe('');
    expect(result.price).toBe(0);
    expect(result.status).toBe('available'); 
  });
});



describe('mapFormToBackend', () => {
  const formData = {
    propertyType: 'apartment',
    title: 'My Flat',
    propertyDescription: 'Nice flat',
    pricePerMonth: '1500',
    city: 'Jeddah',
    district: 'Al Hamra',
    address: '789 Road',
    latitude: '21.5',
    longitude: '39.1',
    numRooms: '3',
    areaSqm: '100',
    isAvailable: true,
  };

  it('uppercases propertyType', () => {
    expect(mapFormToBackend(formData).propertyType).toBe('APARTMENT');
  });

  it('converts pricePerMonth to number', () => {
    expect(typeof mapFormToBackend(formData).pricePerMonth).toBe('number');
    expect(mapFormToBackend(formData).pricePerMonth).toBe(1500);
  });

  it('converts latitude and longitude to numbers', () => {
    const result = mapFormToBackend(formData);
    expect(result.latitude).toBe(21.5);
    expect(result.longitude).toBe(39.1);
  });

  it('converts numRooms to number', () => {
    expect(typeof mapFormToBackend(formData).numRooms).toBe('number');
  });

  it('handles isAvailable false', () => {
    expect(mapFormToBackend({ ...formData, isAvailable: false }).isAvailable).toBe(false);
  });

  it('defaults isAvailable to true when undefined', () => {
    const { isAvailable, ...rest } = formData;
    expect(mapFormToBackend(rest).isAvailable).toBe(true);
  });

  it('returns null for empty numeric fields', () => {
    const result = mapFormToBackend({ ...formData, latitude: '', numRooms: '' });
    expect(result.latitude).toBeNull();
    expect(result.numRooms).toBeNull();
  });
});



describe('mapUserToFrontend', () => {
  const rawUser = {
    user_id: 5,
    email: 'user@test.com',
    username: 'testuser',
    full_name: 'Test Person',
    mobile_number: '0501234567',
    avatar_url: 'https://cdn.test/avatar.jpg',
    role_name: 'TENANT',
    is_active: true,
  };

  it('maps user_id to id', () => {
    expect(mapUserToFrontend(rawUser).id).toBe(5);
  });

  it('maps TENANT role to "tenant"', () => {
    expect(mapUserToFrontend(rawUser).role).toBe('tenant');
  });

  it('maps ADMIN role to "admin"', () => {
    expect(mapUserToFrontend({ ...rawUser, role_name: 'ADMIN' }).role).toBe('admin');
  });

  it('maps VISITOR role to "visitor"', () => {
    expect(mapUserToFrontend({ ...rawUser, role_name: 'VISITOR' }).role).toBe('visitor');
  });

  it('maps full_name to name', () => {
    expect(mapUserToFrontend(rawUser).name).toBe('Test Person');
  });

  it('falls back to username when full_name is missing', () => {
    expect(mapUserToFrontend({ ...rawUser, full_name: undefined }).name).toBe('testuser');
  });

  it('maps mobile_number to phone', () => {
    expect(mapUserToFrontend(rawUser).phone).toBe('0501234567');
  });

  it('maps avatar_url to avatar', () => {
    expect(mapUserToFrontend(rawUser).avatar).toBe('https://cdn.test/avatar.jpg');
  });

  it('maps is_active to boolean active', () => {
    expect(mapUserToFrontend(rawUser).active).toBe(true);
    expect(mapUserToFrontend({ ...rawUser, is_active: false }).active).toBe(false);
  });

  it('returns null for null input', () => {
    expect(mapUserToFrontend(null)).toBeNull();
  });
});

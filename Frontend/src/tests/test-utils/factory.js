




let _idSeq = 100;
const nextId = () => ++_idSeq;




export const createMockUser = (overrides = {}) => ({
  id: nextId(),
  email: `user${_idSeq}@test.com`,
  name: `Test User ${_idSeq}`,
  username: `testuser${_idSeq}`,
  role: 'tenant',
  role_name: 'TENANT',
  avatar: null,
  phone: null,
  active: true,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
  ...overrides,
});

export const createMockAdmin   = (overrides = {}) => createMockUser({ role: 'admin',   role_name: 'ADMIN',   ...overrides });
export const createMockTenant  = (overrides = {}) => createMockUser({ role: 'tenant',  role_name: 'TENANT',  ...overrides });
export const createMockVisitor = (overrides = {}) => createMockUser({ role: 'visitor', role_name: 'VISITOR', ...overrides });



export const createRawUser = (overrides = {}) => ({
  user_id: nextId(),
  email: `rawuser${_idSeq}@test.com`,
  username: `rawuser${_idSeq}`,
  full_name: `Raw User ${_idSeq}`,
  mobile_number: null,
  avatar_url: null,
  role_name: 'TENANT',
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
  ...overrides,
});




export const createMockPropertyDetails = (overrides = {}) => {
  const id = nextId();
  const defaults = {
    property: {
      propertyId: id,
      ownerId: 1,
      propertyType: 'APARTMENT',
      title: `Test Apartment ${id}`,
      propertyDescription: `Description for property ${id}`,
      pricePerMonth: 1000 + id,
      city: 'Riyadh',
      district: 'Al Olaya',
      address: `${id} Test Street`,
      latitude: 24.688,
      longitude: 46.722,
      numRooms: 2,
      areaSqm: 90,
      isAvailable: true,
      createdAt: '2024-01-01T10:00:00',
      updatedAt: '2024-01-01T10:00:00',
    },
    propertyImages: [`https://via.placeholder.com/400`],
    coverPic: `https://via.placeholder.com/400`
  };

  if (overrides.property) {
    defaults.property = { ...defaults.property, ...overrides.property };
    delete overrides.property;
  }
  return { ...defaults, ...overrides };
};


export const createMockProperty = (overrides = {}) => {
  const id = nextId();
  return {
    id: String(id),
    title: `Test Property ${id}`,
    description: `Description for property ${id}`,
    price: 1200,
    location: 'Riyadh, Al Olaya, Main St',
    city: 'Riyadh',
    district: 'Al Olaya',
    address: 'Main St',
    propertyType: 'apartment',
    status: 'available',
    numRooms: 2,
    areaSqm: 90,
    latitude: 24.688,
    longitude: 46.722,
    ownerId: 1,
    images: [`https://via.placeholder.com/400`],
    coverPic: `https://via.placeholder.com/400`,
    createdAt: '2024-01-01T10:00:00',
    updatedAt: '2024-01-01T10:00:00',
    ...overrides,
  };
};



export const createMockRentalRequest = (overrides = {}) => ({
  rentalReqId: nextId(),
  propertyId: 101,
  tenantId: 2,
  message: 'I would like to rent this property.',
  desiredStart: '2024-06-01',
  desiredMonths: 12,
  reqStatus: 'PENDING',
  reviewedAt: null,
  createdAt: '2024-05-01T10:00:00',
  updatedAt: '2024-05-01T10:00:00',
  ...overrides,
});



export const createMockContract = (overrides = {}) => ({
  contractId: nextId(),
  rentalRequestId: 10,
  propertyId: 101,
  ownerId: 1,
  tenantId: 2,
  contractStatus: 'ACTIVE',
  rentAmount: 1500,
  durationMonths: 12,
  startDate: '2024-06-01',
  endDate: '2025-06-01',
  pdfUrl: null,
  notes: null,
  createdAt: '2024-05-15T10:00:00',
  updatedAt: '2024-05-15T10:00:00',
  ...overrides,
});



export const createMockFavorite = (userOverrides = {}, propertyOverrides = {}) => ({
  user: createRawUser(userOverrides),
  propertyDetails: createMockPropertyDetails(propertyOverrides),
});

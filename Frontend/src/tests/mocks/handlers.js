// src/tests/mocks/handlers.js
//
// MSW v1 request handlers — covers all 24 RentSphere API endpoints.
// Default responses simulate happy-path. Tests can override per-case
// using server.use(...) inside individual test files.

import { rest } from 'msw';
import { RAW_ADMIN_USER, RAW_TENANT_USER, MOCK_TOKEN } from './authMocks';

// ── Reusable mock data ─────────────────────────────────────────────

const MOCK_PROPERTY_DETAILS = {
  property: {
    propertyId: 101,
    ownerId: 1,
    propertyType: 'APARTMENT',
    title: 'Cozy Downtown Apartment',
    propertyDescription: 'A beautiful apartment in the city center.',
    pricePerMonth: 1500,
    city: 'Riyadh',
    district: 'Al Olaya',
    address: '123 Main St',
    latitude: 24.688,
    longitude: 46.722,
    numRooms: 3,
    areaSqm: 120,
    isAvailable: true,
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-01-15T10:00:00',
  },
  propertyImages: ['https://example.com/img1.jpg'],
  coverPic: 'https://example.com/img1.jpg',
};

const MOCK_PROPERTY_DETAILS_2 = {
  property: {
    propertyId: 102,
    ownerId: 1,
    propertyType: 'VILLA',
    title: 'Spacious Villa',
    propertyDescription: 'Large villa with garden.',
    pricePerMonth: 4000,
    city: 'Jeddah',
    district: 'Al Hamra',
    address: '456 Park Ave',
    latitude: 21.543,
    longitude: 39.172,
    numRooms: 6,
    areaSqm: 350,
    isAvailable: true,
    createdAt: '2024-02-01T10:00:00',
    updatedAt: '2024-02-01T10:00:00',
  },
  propertyImages: [],
  coverPic: null,
};

const MOCK_FAVORITE = {
  user: RAW_TENANT_USER,
  propertyDetails: MOCK_PROPERTY_DETAILS,
};

const MOCK_RENTAL_REQUEST = {
  rentalReqId: 10,
  propertyId: 101,
  tenantId: 2,
  message: 'I would like to rent this property.',
  desiredStart: '2024-03-01',
  desiredMonths: 12,
  reqStatus: 'PENDING',
  reviewedAt: null,
  createdAt: '2024-02-10T10:00:00',
  updatedAt: '2024-02-10T10:00:00',
};

const MOCK_CONTRACT = {
  contractId: 5,
  rentalRequestId: 10,
  propertyId: 101,
  ownerId: 1,
  tenantId: 2,
  contractStatus: 'ACTIVE',
  rentAmount: 1500,
  durationMonths: 12,
  startDate: '2024-03-01',
  endDate: '2025-03-01',
  pdfUrl: null,
  notes: null,
  createdAt: '2024-02-15T10:00:00',
  updatedAt: '2024-02-15T10:00:00',
};

// ── Handlers ───────────────────────────────────────────────────────

export const handlers = [

  // ── Auth ──────────────────────────────────────────────────────────

  rest.post('/api/user/register', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }))
  ),

  rest.post('/api/user/login', async (req, res, ctx) => {
    const body = await req.json();
    if (body.email === 'wrong@test.com') {
      return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
    }
    return res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }));
  }),

  rest.get('/api/user/me', (req, res, ctx) => {
    // Return admin by default; tests that need tenant override with server.use()
    const auth = req.headers.get('Authorization');
    if (!auth) return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
    return res(ctx.status(200), ctx.json(RAW_ADMIN_USER));
  }),

  rest.put('/api/user/me', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ user: RAW_ADMIN_USER, token: MOCK_TOKEN }))
  ),

  rest.post('/api/user/logout', (req, res, ctx) =>
    res(ctx.status(200))
  ),

  // ── Properties ────────────────────────────────────────────────────

  rest.get('/api/properties/all', (req, res, ctx) =>
    res(ctx.status(200), ctx.json([MOCK_PROPERTY_DETAILS, MOCK_PROPERTY_DETAILS_2]))
  ),

  rest.get('/api/properties/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === '999') {
      return res(ctx.status(404), ctx.json({ message: 'Property not found' }));
    }
    return res(ctx.status(200), ctx.json(MOCK_PROPERTY_DETAILS));
  }),

  rest.post('/api/properties/add', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_PROPERTY_DETAILS))
  ),

  rest.put('/api/properties/:id/update', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_PROPERTY_DETAILS))
  ),

  rest.delete('/api/properties/:id/delete', (req, res, ctx) =>
    res(ctx.status(200))
  ),

  rest.get('/api/properties/filter', (req, res, ctx) =>
    res(ctx.status(200), ctx.json([MOCK_PROPERTY_DETAILS]))
  ),

  rest.get('/api/properties/search', (req, res, ctx) =>
    res(ctx.status(200), ctx.json([MOCK_PROPERTY_DETAILS]))
  ),

  rest.post('/api/properties/:propertyId/favorite', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_FAVORITE))
  ),

  rest.get('/api/properties/favorites/all', (req, res, ctx) =>
    res(ctx.status(200), ctx.json([MOCK_FAVORITE]))
  ),

  rest.post('/api/properties/:id/images/add', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ message: 'Image added' }))
  ),

  // ── Rent ──────────────────────────────────────────────────────────

  rest.post('/api/rent/request', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_RENTAL_REQUEST))
  ),

  rest.get('/api/rent/requests/all', (req, res, ctx) =>
    res(ctx.status(200), ctx.json([MOCK_RENTAL_REQUEST]))
  ),

  rest.get('/api/rent/requests/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_RENTAL_REQUEST))
  ),

  rest.put('/api/rent/requests/:id/accept', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_CONTRACT))
  ),

  rest.put('/api/rent/requests/:id/reject', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ ...MOCK_RENTAL_REQUEST, reqStatus: 'REJECTED' }))
  ),

  rest.get('/api/rent/contracts/all', (req, res, ctx) =>
    res(ctx.status(200), ctx.json([MOCK_CONTRACT]))
  ),

  rest.post('/api/rent/contracts/:contractId/paypal', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({
      approvalUrl: 'https://www.paypal.com/checkoutnow?token=EC-TEST',
      paymentId: 'PAY-TEST123',
    }))
  ),

  rest.post('/api/rent/contracts/:contractId/paypal/execute', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ message: 'Payment executed successfully' }))
  ),
];

// Re-export mock data for use in tests
export { MOCK_PROPERTY_DETAILS, MOCK_PROPERTY_DETAILS_2, MOCK_FAVORITE, MOCK_RENTAL_REQUEST, MOCK_CONTRACT };

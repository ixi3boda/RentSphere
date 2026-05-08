// src/tests/services/contracts.test.js
//
// Backend/frontend contract validation tests.
// Ensures that API responses match expected DTO shapes so frontend/backend
// mismatches are caught immediately. Uses MSW to simulate backend responses.

import { propertyApi, rentApi, authApi } from '../../utils/api';
import { seedSessionStorage } from '../test-utils/mockLocalStorage';
import { MOCK_TOKEN, MOCK_TENANT } from '../mocks/authMocks';

beforeEach(() => {
  seedSessionStorage(MOCK_TENANT, MOCK_TOKEN);
});

// ── PropertyDetails DTO ────────────────────────────────────────────

describe('PropertyDetails DTO contract', () => {
  it('getAll response items match PropertyDetails shape', async () => {
    const res = await propertyApi.getAll();
    const item = res.data[0];

    expect(item).toMatchObject({
      property: expect.objectContaining({
        propertyId: expect.any(Number),
        ownerId: expect.any(Number),
        propertyType: expect.any(String),
        title: expect.any(String),
        pricePerMonth: expect.any(Number),
        city: expect.any(String),
        isAvailable: expect.any(Boolean),
      }),
      propertyImages: expect.any(Array),
      // coverPic can be null or string
    });
  });

  it('getById response matches PropertyDetails shape', async () => {
    const res = await propertyApi.getById(101);
    expect(res.data.property).toMatchObject({
      propertyId: expect.any(Number),
      title: expect.any(String),
    });
  });
});

// ── Favorite DTO ──────────────────────────────────────────────────

describe('Favorite DTO contract', () => {
  it('getFavorites response items match Favorite shape', async () => {
    const res = await propertyApi.getFavorites();
    const item = res.data[0];

    expect(item).toMatchObject({
      user: expect.objectContaining({
        user_id: expect.any(Number),
        email: expect.any(String),
        role_name: expect.any(String),
      }),
      propertyDetails: expect.objectContaining({
        property: expect.any(Object),
        propertyImages: expect.any(Array),
      }),
    });
  });
});

// ── RentalRequest DTO ─────────────────────────────────────────────

describe('RentalRequest DTO contract', () => {
  it('createRequest response matches RentalRequest shape', async () => {
    const res = await rentApi.createRequest({
      propertyId: 101,
      message: 'test',
      desiredStart: '2024-06-01',
      desiredMonths: 12,
    });

    expect(res.data).toMatchObject({
      rentalReqId: expect.any(Number),
      propertyId: expect.any(Number),
      tenantId: expect.any(Number),
      reqStatus: expect.any(String),
      desiredStart: expect.any(String),
      desiredMonths: expect.any(Number),
    });
    // Ensure reqStatus is one of the valid enum values
    expect(['PENDING', 'ACCEPTED', 'REJECTED']).toContain(res.data.reqStatus);
  });

  it('getAllRequests response items match RentalRequest shape', async () => {
    const res = await rentApi.getAllRequests();
    expect(res.data[0]).toMatchObject({
      rentalReqId: expect.any(Number),
      reqStatus: expect.any(String),
    });
  });
});

// ── Contract DTO ──────────────────────────────────────────────────

describe('Contract DTO contract', () => {
  it('getAllContracts response items match Contract shape', async () => {
    const res = await rentApi.getAllContracts();
    const contract = res.data[0];

    expect(contract).toMatchObject({
      contractId: expect.any(Number),
      propertyId: expect.any(Number),
      tenantId: expect.any(Number),
      contractStatus: expect.any(String),
      rentAmount: expect.any(Number),
      durationMonths: expect.any(Number),
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
    // Validate contractStatus enum
    expect(['ACTIVE', 'PENDING_PAYMENT', 'TERMINATED', 'EXPIRED', 'COMPLETED'])
      .toContain(contract.contractStatus);
  });

  it('acceptRequest response contains contractId (creates a Contract)', async () => {
    const res = await rentApi.acceptRequest(10);
    expect(res.data).toHaveProperty('contractId');
    expect(res.data).toHaveProperty('contractStatus');
  });
});

// ── User DTO ──────────────────────────────────────────────────────

describe('User DTO contract', () => {
  it('getMe response matches User DTO shape', async () => {
    const res = await authApi.getMe();

    expect(res.data).toMatchObject({
      user_id: expect.any(Number),
      email: expect.any(String),
      role_name: expect.any(String),
    });
    // Validate role_name is one of the three known roles
    expect(['ADMIN', 'TENANT', 'VISITOR']).toContain(res.data.role_name);
  });
});

// ── PayPal DTO ────────────────────────────────────────────────────

describe('PayPal DTO contract', () => {
  it('createPayPalPayment response contains approvalUrl and paymentId', async () => {
    const res = await rentApi.createPayPalPayment(5, {
      amount: 1500,
      currency: 'USD',
      description: 'Rent payment',
      successUrl: 'http://localhost/callback',
      cancelUrl: 'http://localhost/callback',
    });

    expect(res.data).toMatchObject({
      approvalUrl: expect.any(String),
      paymentId: expect.any(String),
    });
    expect(res.data.approvalUrl).toContain('paypal.com');
  });
});

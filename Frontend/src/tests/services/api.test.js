





import { authApi, propertyApi, rentApi } from '../../utils/api';
import { clearStorage, seedSessionStorage } from '../test-utils/mockLocalStorage';
import { MOCK_TOKEN, MOCK_TENANT } from '../mocks/authMocks';

beforeEach(() => {
  clearStorage();
});



describe('authApi', () => {
  describe('register', () => {
    it('resolves with token on success', async () => {
      const res = await authApi.register({
        email: 'new@test.com',
        password_hash: 'pass123',
        username: 'newuser',
        full_name: 'New User',
        mobile_number: '',
        avatar_url: '',
      });
      expect(res.data.token).toBeDefined();
      expect(typeof res.data.token).toBe('string');
    });
  });

  describe('login', () => {
    it('resolves with token for valid credentials', async () => {
      const res = await authApi.login({ email: 'admin@test.com', password_hash: 'pass' });
      expect(res.data.token).toBe(MOCK_TOKEN);
    });

    it('throws 401 for wrong credentials', async () => {
      await expect(
        authApi.login({ email: 'wrong@test.com', password_hash: 'bad' })
      ).rejects.toMatchObject({ response: { status: 401 } });
    });
  });

  describe('getMe', () => {
    it('resolves with user data when token present', async () => {
      seedSessionStorage(MOCK_TENANT, MOCK_TOKEN);
      const res = await authApi.getMe();
      expect(res.data).toHaveProperty('email');
      expect(res.data).toHaveProperty('role_name');
    });

    it('throws 401 when no token', async () => {
      await expect(authApi.getMe()).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe('updateProfile', () => {
    it('resolves with updated user', async () => {
      seedSessionStorage(MOCK_TENANT, MOCK_TOKEN);
      const res = await authApi.updateProfile({ full_name: 'Updated Name' });
      expect(res.data).toHaveProperty('user');
    });
  });

  describe('logout', () => {
    it('resolves with 200', async () => {
      seedSessionStorage(MOCK_TENANT, MOCK_TOKEN);
      const res = await authApi.logout();
      expect(res.status).toBe(200);
    });
  });
});



describe('propertyApi', () => {
  beforeEach(() => seedSessionStorage(MOCK_TENANT, MOCK_TOKEN));

  describe('getAll', () => {
    it('resolves with array of PropertyDetails', async () => {
      const res = await propertyApi.getAll();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0]).toHaveProperty('property');
      expect(res.data[0]).toHaveProperty('coverPic');
    });
  });

  describe('getById', () => {
    it('resolves with a single PropertyDetails', async () => {
      const res = await propertyApi.getById(101);
      expect(res.data.property.propertyId).toBe(101);
    });

    it('throws 404 for unknown id', async () => {
      await expect(propertyApi.getById(999)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('getFavorites', () => {
    it('resolves with array of Favorite objects', async () => {
      const res = await propertyApi.getFavorites();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0]).toHaveProperty('propertyDetails');
      expect(res.data[0]).toHaveProperty('user');
    });
  });

  describe('favorite (toggle)', () => {
    it('resolves with a Favorite object', async () => {
      const res = await propertyApi.favorite(101);
      expect(res.data).toHaveProperty('propertyDetails');
    });
  });
});



describe('rentApi', () => {
  beforeEach(() => seedSessionStorage(MOCK_TENANT, MOCK_TOKEN));

  describe('createRequest', () => {
    it('resolves with a RentalRequest object', async () => {
      const res = await rentApi.createRequest({
        propertyId: 101,
        message: 'I want to rent',
        desiredStart: '2024-06-01',
        desiredMonths: 12,
      });
      expect(res.data).toHaveProperty('rentalReqId');
      expect(res.data).toHaveProperty('reqStatus');
    });
  });

  describe('getAllRequests', () => {
    it('resolves with array of RentalRequest', async () => {
      const res = await rentApi.getAllRequests();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0]).toHaveProperty('rentalReqId');
    });
  });

  describe('acceptRequest', () => {
    it('resolves with a Contract object', async () => {
      const res = await rentApi.acceptRequest(10);
      expect(res.data).toHaveProperty('contractId');
      expect(res.data).toHaveProperty('contractStatus');
    });
  });

  describe('rejectRequest', () => {
    it('resolves with rejected RentalRequest', async () => {
      const res = await rentApi.rejectRequest(10);
      expect(res.data.reqStatus).toBe('REJECTED');
    });
  });

  describe('getAllContracts', () => {
    it('resolves with array of Contract', async () => {
      const res = await rentApi.getAllContracts();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0]).toHaveProperty('contractId');
      expect(res.data[0]).toHaveProperty('contractStatus');
    });
  });

  describe('createPayPalPayment', () => {
    it('resolves with approvalUrl and paymentId', async () => {
      const res = await rentApi.createPayPalPayment(5, {
        amount: 1500,
        currency: 'USD',
        description: 'Monthly rent',
        successUrl: 'http://localhost:3000/paypal/callback',
        cancelUrl: 'http://localhost:3000/paypal/callback',
      });
      expect(res.data).toHaveProperty('approvalUrl');
      expect(res.data).toHaveProperty('paymentId');
    });
  });
});

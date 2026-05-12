





import apiClient from '../../utils/api';
import { rest } from 'msw';
import { server } from '../mocks/server';
import { MOCK_TOKEN } from '../mocks/authMocks';


const TEST_ENDPOINT = '/api/user/me';

describe('Axios JWT Interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('attaches Authorization header from sessionStorage', async () => {
    let capturedAuth = null;

    server.use(
      rest.get(TEST_ENDPOINT, (req, res, ctx) => {
        capturedAuth = req.headers.get('Authorization');
        return res(ctx.status(200), ctx.json({ email: 'test@test.com', role_name: 'TENANT' }));
      })
    );

    sessionStorage.setItem('token', MOCK_TOKEN);
    await apiClient.get(TEST_ENDPOINT);

    expect(capturedAuth).toBe(`Bearer ${MOCK_TOKEN}`);
  });

  it('attaches Authorization header from localStorage (stay-signed-in)', async () => {
    let capturedAuth = null;

    server.use(
      rest.get(TEST_ENDPOINT, (req, res, ctx) => {
        capturedAuth = req.headers.get('Authorization');
        return res(ctx.status(200), ctx.json({ email: 'test@test.com', role_name: 'TENANT' }));
      })
    );

    localStorage.setItem('token', MOCK_TOKEN);
    await apiClient.get(TEST_ENDPOINT);

    expect(capturedAuth).toBe(`Bearer ${MOCK_TOKEN}`);
  });

  it('prefers sessionStorage token over localStorage', async () => {
    const sessionToken = 'session-token-abc';
    const localToken   = 'local-token-xyz';
    let capturedAuth = null;

    server.use(
      rest.get(TEST_ENDPOINT, (req, res, ctx) => {
        capturedAuth = req.headers.get('Authorization');
        return res(ctx.status(200), ctx.json({ email: 'test@test.com', role_name: 'TENANT' }));
      })
    );

    sessionStorage.setItem('token', sessionToken);
    localStorage.setItem('token', localToken);
    await apiClient.get(TEST_ENDPOINT);

    expect(capturedAuth).toBe(`Bearer ${sessionToken}`);
  });

  it('sends no Authorization header when no token exists', async () => {
    let capturedAuth = 'NOT_SET';

    server.use(
      rest.get(TEST_ENDPOINT, (req, res, ctx) => {
        capturedAuth = req.headers.get('Authorization');
        return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
      })
    );

    try {
      await apiClient.get(TEST_ENDPOINT);
    } catch (_) {
      
    }

    expect(capturedAuth).toBeNull();
  });

  it('sends Content-Type: application/json', async () => {
    let capturedContentType = null;

    server.use(
      rest.post('/api/user/login', (req, res, ctx) => {
        capturedContentType = req.headers.get('Content-Type');
        return res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }));
      })
    );

    await apiClient.post('/api/user/login', { email: 'a@b.com', password_hash: 'pass' });

    expect(capturedContentType).toContain('application/json');
  });
});

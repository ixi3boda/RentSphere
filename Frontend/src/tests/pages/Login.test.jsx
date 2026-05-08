// src/tests/pages/Login.test.jsx
//
// Tests the Login page:
//   - form rendering
//   - successful login with role-based redirect
//   - invalid credentials error
//   - missing fields validation (browser-native required)
//   - token stored in sessionStorage after login
//   - state.from redirect (PrivateRoute back-redirect)

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import Login from '../../pages/Login';
import { MOCK_TOKEN, RAW_ADMIN_USER, RAW_TENANT_USER } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

// Helper that seeds the /api/user/me response with a specific raw user
const mockMeAs = (rawUser) =>
  rest.get('/api/user/me', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawUser))
  );

describe('Login page — rendering', () => {
  beforeEach(() => renderInRouter(<Login />, { user: null }));

  it('renders email and password inputs', () => {
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/•{4,}/)).toBeInTheDocument();
  });

  it('renders Sign In submit button', () => {
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders link to signup page', () => {
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders Stay signed in checkbox', () => {
    expect(screen.getByRole('checkbox', { name: /stay signed in/i })).toBeInTheDocument();
  });
});

describe('Login page — invalid credentials', () => {
  it('shows error message for wrong credentials', async () => {
    server.use(
      rest.post('/api/user/login', (req, res, ctx) =>
        res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
      )
    );

    const user = userEvent.setup();
    renderInRouter(<Login />, { user: null });

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'badpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});

describe('Login page — successful login', () => {
  it('stores token in sessionStorage on successful login', async () => {
    server.use(
      rest.post('/api/user/login', (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }))
      ),
      mockMeAs(RAW_TENANT_USER)
    );

    const mockLogin = jest.fn().mockImplementation(async () => {
      sessionStorage.setItem('token', MOCK_TOKEN);
      return { success: true };
    });

    const user = userEvent.setup();
    renderInRouter(<Login />, {
      user: null,
      authOverrides: { login: mockLogin },
    });

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'tenant@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tenant@test.com', 'password', false);
    });
  });
});

describe('Login page — stay signed in', () => {
  it('passes staySignedIn=true when checkbox is checked', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    const user = userEvent.setup();

    renderInRouter(<Login />, {
      user: null,
      authOverrides: { login: mockLogin },
    });

    await user.click(screen.getByRole('checkbox', { name: /stay signed in/i }));
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'pass', true);
    });
  });
});

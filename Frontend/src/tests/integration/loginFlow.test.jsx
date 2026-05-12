







import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { rest } from 'msw';
import Login from '../../pages/Login';
import { MOCK_TOKEN, RAW_ADMIN_USER, RAW_TENANT_USER, RAW_VISITOR_USER } from '../mocks/authMocks';
import { AuthProvider } from '../../context/AuthContext';
import { server } from '../mocks/server';

const AdminPage   = () => <div>Admin Dashboard Page</div>;
const TenantPage  = () => <div>Tenant Dashboard Page</div>;
const PropertiesPage = () => <div>Properties Page</div>;

function renderLoginFlow() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminPage />} />
          <Route path="/tenant/dashboard" element={<TenantPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login Flow — TENANT', () => {
  it('redirects to /tenant/dashboard after successful tenant login', async () => {
    server.use(
      rest.post('/api/user/login', (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }))
      ),
      rest.get('/api/user/me', (req, res, ctx) =>
        res(ctx.status(200), ctx.json(RAW_TENANT_USER))
      )
    );

    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'tenant@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Tenant Dashboard Page')).toBeInTheDocument();
  });
});

describe('Login Flow — ADMIN', () => {
  it('redirects to /admin/dashboard after successful admin login', async () => {
    server.use(
      rest.post('/api/user/login', (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }))
      ),
      rest.get('/api/user/me', (req, res, ctx) =>
        res(ctx.status(200), ctx.json(RAW_ADMIN_USER))
      )
    );

    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'adminpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Admin Dashboard Page')).toBeInTheDocument();
  });
});

describe('Login Flow — VISITOR', () => {
  it('redirects to /tenant/dashboard for VISITOR role', async () => {
    server.use(
      rest.post('/api/user/login', (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ token: MOCK_TOKEN }))
      ),
      rest.get('/api/user/me', (req, res, ctx) =>
        res(ctx.status(200), ctx.json(RAW_VISITOR_USER))
      )
    );

    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'visitor@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'visitorpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Tenant Dashboard Page')).toBeInTheDocument();
  });
});

describe('Login Flow — Failure', () => {
  it('shows error and stays on login page for wrong credentials', async () => {
    server.use(
      rest.post('/api/user/login', (req, res, ctx) =>
        res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
      )
    );

    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'bad@test.com');
    await user.type(screen.getByPlaceholderText(/•{4,}/), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/failed|invalid/i)).toBeInTheDocument();
    expect(screen.queryByText('Tenant Dashboard Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard Page')).not.toBeInTheDocument();
  });
});

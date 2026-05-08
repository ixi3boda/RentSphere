// src/tests/integration/navigationFlow.test.jsx
//
// Tests navigation and routing:
//   - PrivateRoute blocks unauthenticated access and redirects to /login
//   - Role-based routes redirect correctly
//   - Navigation between pages works
//   - Invalid routes fall back gracefully

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import PrivateRoute from '../../components/PrivateRoute';
import Navbar from '../../components/Navbar';
import { MOCK_ADMIN, MOCK_TENANT, MOCK_VISITOR } from '../mocks/authMocks';
import { buildAuthValue } from '../test-utils/renderWithProviders';

const HomePage        = () => <div>Home Page</div>;
const LoginPage       = () => <div>Login Page</div>;
const PropertiesPage  = () => <div>Properties Page</div>;
const ProfilePage     = () => <div>Profile Page</div>;
const AdminDash       = () => <div>Admin Dashboard</div>;
const TenantDash      = () => <div>Tenant Dashboard</div>;
const NotFound        = () => <div>Not Found</div>;

function buildApp(user, initialRoute = '/') {
  return render(
    <AuthContext.Provider value={buildAuthValue({ user })}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/tenant/dashboard" element={<TenantDash />} />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDash />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Navigation — unauthenticated', () => {
  it('blocks /profile for unauthenticated and redirects to /login', () => {
    buildApp(null, '/profile');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  it('allows browsing /properties without auth', () => {
    buildApp(null, '/properties');
    expect(screen.getByText('Properties Page')).toBeInTheDocument();
  });

  it('allows browsing /tenant/dashboard without auth (public route)', () => {
    buildApp(null, '/tenant/dashboard');
    expect(screen.getByText('Tenant Dashboard')).toBeInTheDocument();
  });
});

describe('Navigation — TENANT', () => {
  it('can access /profile', () => {
    buildApp(MOCK_TENANT, '/profile');
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  it('can access /tenant/dashboard', () => {
    buildApp(MOCK_TENANT, '/tenant/dashboard');
    expect(screen.getByText('Tenant Dashboard')).toBeInTheDocument();
  });

  it('is blocked from /admin/dashboard', () => {
    buildApp(MOCK_TENANT, '/admin/dashboard');
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});

describe('Navigation — ADMIN', () => {
  it('can access /admin/dashboard', () => {
    buildApp(MOCK_ADMIN, '/admin/dashboard');
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});

describe('Navigation — invalid routes', () => {
  it('renders Not Found for unknown route', () => {
    buildApp(MOCK_TENANT, '/this/does/not/exist');
    expect(screen.getByText('Not Found')).toBeInTheDocument();
  });
});

describe('Navigation — Navbar links', () => {
  it('Browse link navigates to /properties', async () => {
    const user = userEvent.setup();
    buildApp(MOCK_TENANT, '/');

    const browseBtn = screen.getAllByRole('button', { name: /browse/i })[0];
    await user.click(browseBtn);
    expect(screen.getByText('Properties Page')).toBeInTheDocument();
  });
});

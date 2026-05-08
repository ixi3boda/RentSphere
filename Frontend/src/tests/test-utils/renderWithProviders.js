// src/tests/test-utils/renderWithProviders.js
//
// Custom RTL render utility that wraps the component under test with:
//   - MemoryRouter (for useNavigate / useLocation / Link)
//   - AuthContext.Provider (pre-seeded with a mock user)
//
// Usage:
//   renderWithProviders(<Login />, { user: MOCK_TENANT, route: '/login' })
//   renderWithProviders(<Navbar />) // unauthenticated by default

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

/**
 * Build a mock AuthContext value.
 * Any key can be overridden via `authOverrides`.
 */
export function buildAuthValue({
  user = null,
  loading = false,
  initializing = false,
  login = jest.fn().mockResolvedValue({ success: true }),
  signup = jest.fn().mockResolvedValue({ success: true }),
  logout = jest.fn(),
  updateProfile = jest.fn().mockResolvedValue({ success: true }),
  refreshUser = jest.fn().mockResolvedValue({ success: true }),
} = {}) {
  return {
    user,
    loading,
    initializing,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    refreshUser,
  };
}

/**
 * @param {React.ReactElement} ui - Component to render
 * @param {object} options
 * @param {object|null} options.user - Mapped frontend user (or null for unauthenticated)
 * @param {string}  options.route - Initial URL (default '/')
 * @param {string}  options.path  - Route path pattern (for :params)
 * @param {object}  options.authOverrides - Override specific AuthContext values
 */
export function renderWithProviders(
  ui,
  { user = null, route = '/', path = '*', authOverrides = {} } = {}
) {
  const authValue = buildAuthValue({ user, ...authOverrides });

  const Wrapper = ({ children }) => (
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={children} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

  return render(ui, { wrapper: Wrapper });
}

/**
 * Simpler wrapper for components that don't need a specific route path.
 */
export function renderInRouter(ui, { user = null, route = '/', authOverrides = {} } = {}) {
  const authValue = buildAuthValue({ user, ...authOverrides });

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

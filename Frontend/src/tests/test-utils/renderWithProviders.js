









import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';


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

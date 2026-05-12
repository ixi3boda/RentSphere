






import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import PrivateRoute from '../../components/PrivateRoute';
import { MOCK_TENANT } from '../mocks/authMocks';
import { buildAuthValue } from '../test-utils/renderWithProviders';

const Protected = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

function renderWithRoutes(authValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <Protected />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('PrivateRoute', () => {
  it('renders children when user is authenticated', () => {
    renderWithRoutes(buildAuthValue({ user: MOCK_TENANT }));
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithRoutes(buildAuthValue({ user: null }));
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders nothing while initializing (prevents content flash)', () => {
    renderWithRoutes(buildAuthValue({ user: null, initializing: true }));
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

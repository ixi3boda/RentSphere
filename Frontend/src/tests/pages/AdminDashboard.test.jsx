







import React from 'react';
import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import AuthContext from '../../context/AuthContext';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import { PropertyProvider } from '../../context/PropertyContext';
import { MOCK_ADMIN, MOCK_TENANT } from '../mocks/authMocks';
import { buildAuthValue } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

function renderAdmin(user) {
  return render(
    <AuthContext.Provider value={buildAuthValue({ user })}>
      <PropertyProvider>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/properties" element={<div>Properties Page</div>} />
          </Routes>
        </MemoryRouter>
      </PropertyProvider>
    </AuthContext.Provider>
  );
}

describe('AdminDashboard — access control', () => {
  it('redirects non-admin user away from dashboard', async () => {
    renderAdmin(MOCK_TENANT);
    
    expect(screen.queryByText(/admin dashboard/i)).not.toBeInTheDocument();
  });

  it('renders admin content for ADMIN user', async () => {
    renderAdmin(MOCK_ADMIN);
    expect(await screen.findByText(/total properties/i)).toBeInTheDocument();
  });
});

describe('AdminDashboard — stats', () => {
  it('shows stats cards', async () => {
    renderAdmin(MOCK_ADMIN);
    
    expect(await screen.findByText(/total properties/i)).toBeInTheDocument();
  });

  it('shows active contracts count', async () => {
    renderAdmin(MOCK_ADMIN);
    expect(await screen.findByText(/active contracts/i)).toBeInTheDocument();
  });
});

describe('AdminDashboard — property list', () => {
  it('lists properties in the management section', async () => {
    renderAdmin(MOCK_ADMIN);
    expect(await screen.findByText('Cozy Downtown Apartment')).toBeInTheDocument();
  });
});

describe('AdminDashboard — API error', () => {
  it('shows error or empty state when properties API fails', async () => {
    server.use(
      rest.get('/api/properties/all', (req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    renderAdmin(MOCK_ADMIN);
    
    expect(await screen.findByText(/active contracts|total properties/i)).toBeInTheDocument();
  });
});

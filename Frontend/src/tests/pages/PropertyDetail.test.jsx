// src/tests/pages/PropertyDetail.test.jsx
//
// Tests PropertyDetail page:
//   - loads and renders property info
//   - shows "Request Rental" button for TENANT
//   - shows "Tenants Only" for VISITOR
//   - shows "Dashboard" link for ADMIN
//   - shows "Login to Request" for unauthenticated
//   - renders not-found state on 404

import React from 'react';
import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import PropertyDetail from '../../pages/PropertyDetail';
import { MOCK_ADMIN, MOCK_TENANT, MOCK_VISITOR } from '../mocks/authMocks';
import { MOCK_PROPERTY_DETAILS } from '../mocks/handlers';
import { buildAuthValue } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

function renderDetail(user = null, propertyId = '101') {
  const authValue = buildAuthValue({ user });
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[`/properties/${propertyId}`]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('PropertyDetail — loading and content', () => {
  it('shows property title after load', async () => {
    renderDetail(MOCK_TENANT);
    expect(await screen.findByText('Cozy Downtown Apartment')).toBeInTheDocument();
  });

  it('shows price per month', async () => {
    renderDetail(MOCK_TENANT);
    expect(await screen.findByText(/1,500/)).toBeInTheDocument();
  });

  it('shows property location', async () => {
    renderDetail(MOCK_TENANT);
    expect(await screen.findByText(/Riyadh/)).toBeInTheDocument();
  });
});

describe('PropertyDetail — CTA buttons by role', () => {
  it('shows "Request Rental" for TENANT', async () => {
    renderDetail(MOCK_TENANT);
    expect(await screen.findByRole('button', { name: /request rental/i })).toBeInTheDocument();
  });

  it('shows "Tenants Only" for VISITOR', async () => {
    renderDetail(MOCK_VISITOR);
    expect(await screen.findByText(/tenants only/i)).toBeInTheDocument();
  });

  it('shows "Login to Request" for unauthenticated', async () => {
    renderDetail(null);
    expect(await screen.findByRole('link', { name: /login to request/i })).toBeInTheDocument();
  });

  it('shows Dashboard link for ADMIN', async () => {
    renderDetail(MOCK_ADMIN);
    expect(await screen.findByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });
});

describe('PropertyDetail — error states', () => {
  it('shows not-found state on 404', async () => {
    server.use(
      rest.get('/api/properties/:id', (req, res, ctx) =>
        res(ctx.status(404), ctx.json({ message: 'Not found' }))
      )
    );
    renderDetail(MOCK_TENANT, '999');
    expect(await screen.findByText(/property not found/i)).toBeInTheDocument();
  });

  it('shows error state on 500', async () => {
    server.use(
      rest.get('/api/properties/:id', (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ message: 'Internal error' }))
      )
    );
    renderDetail(MOCK_TENANT, '101');
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});

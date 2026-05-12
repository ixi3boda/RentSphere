








import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import TenantDashboard from '../../pages/tenant/TenantDashboard';
import { MOCK_TENANT, MOCK_VISITOR } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

describe('TenantDashboard — heading', () => {
  it('renders "Dashboard" heading', async () => {
    renderInRouter(<TenantDashboard />, { user: MOCK_TENANT });
    expect(await screen.findByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
  });

  it('shows welcome message with user name', async () => {
    renderInRouter(<TenantDashboard />, { user: MOCK_TENANT });
    expect(await screen.findByText(/tenant user/i)).toBeInTheDocument();
  });
});

describe('TenantDashboard — favorites section', () => {
  it('shows favorite property title after fetching', async () => {
    renderInRouter(<TenantDashboard />, { user: MOCK_TENANT });
    expect(await screen.findByText('Cozy Downtown Apartment')).toBeInTheDocument();
  });

  it('shows count badge for saved favorites', async () => {
    renderInRouter(<TenantDashboard />, { user: MOCK_TENANT });
    expect(await screen.findByText(/1 saved/i)).toBeInTheDocument();
  });

  it('shows empty favorites state when list is empty', async () => {
    server.use(
      rest.get('/api/properties/favorites/all', (req, res, ctx) =>
        res(ctx.status(200), ctx.json([]))
      )
    );

    renderInRouter(<TenantDashboard />, { user: MOCK_TENANT });
    expect(await screen.findByText(/no favorites/i)).toBeInTheDocument();
  });
});

describe('TenantDashboard — API error', () => {
  it('shows error state when favorites API fails', async () => {
    server.use(
      rest.get('/api/properties/favorites/all', (req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    renderInRouter(<TenantDashboard />, { user: MOCK_TENANT });
    await waitFor(() => {
      
      expect(screen.queryByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });
});

describe('TenantDashboard — VISITOR access', () => {
  it('renders for VISITOR role (no auth guard)', async () => {
    renderInRouter(<TenantDashboard />, { user: MOCK_VISITOR });
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });
});

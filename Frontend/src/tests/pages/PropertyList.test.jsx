








import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import PropertyList from '../../pages/PropertyList';
import { MOCK_TENANT } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

describe('PropertyList — data loading', () => {
  it('renders property cards after fetching', async () => {
    renderInRouter(<PropertyList />, { user: MOCK_TENANT });
    expect(await screen.findByText('Cozy Downtown Apartment')).toBeInTheDocument();
    expect(await screen.findByText('Spacious Villa')).toBeInTheDocument();
  });

  it('shows loading skeleton before data arrives', () => {
    renderInRouter(<PropertyList />, { user: MOCK_TENANT });
    
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('PropertyList — empty state', () => {
  it('shows empty state message when no properties', async () => {
    server.use(
      rest.get('/api/properties/all', (req, res, ctx) =>
        res(ctx.status(200), ctx.json([]))
      )
    );

    renderInRouter(<PropertyList />, { user: MOCK_TENANT });
    expect(await screen.findByText(/no properties/i)).toBeInTheDocument();
  });
});

describe('PropertyList — API error', () => {
  it('shows error message on 500', async () => {
    server.use(
      rest.get('/api/properties/all', (req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    renderInRouter(<PropertyList />, { user: MOCK_TENANT });
    expect(await screen.findByText(/failed to load|error/i)).toBeInTheDocument();
  });
});

describe('PropertyList — search', () => {
  it('filters cards by keyword', async () => {
    const user = userEvent.setup();
    renderInRouter(<PropertyList />, { user: MOCK_TENANT });

    
    await screen.findByText('Cozy Downtown Apartment');

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Villa');

    await waitFor(() => {
      expect(screen.queryByText('Cozy Downtown Apartment')).not.toBeInTheDocument();
      expect(screen.getByText('Spacious Villa')).toBeInTheDocument();
    });
  });

  it('shows no results message for non-matching search', async () => {
    const user = userEvent.setup();
    renderInRouter(<PropertyList />, { user: MOCK_TENANT });

    await screen.findByText('Cozy Downtown Apartment');
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'xxxxxxnotfound');

    expect(await screen.findByText(/no properties|no results/i)).toBeInTheDocument();
  });
});

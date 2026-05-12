




import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../../components/Navbar';
import { MOCK_ADMIN, MOCK_TENANT, MOCK_VISITOR } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';

describe('Navbar — unauthenticated', () => {
  beforeEach(() => renderInRouter(<Navbar />, { user: null }));

  it('shows Login and Sign Up links', () => {
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows Browse link', () => {
    expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
  });

  it('does NOT show Dashboard link', () => {
    expect(screen.queryByRole('button', { name: /^dashboard$/i })).not.toBeInTheDocument();
  });

  it('does NOT show Logout button', () => {
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });
});

describe('Navbar — ADMIN user', () => {
  beforeEach(() => renderInRouter(<Navbar />, { user: MOCK_ADMIN }));

  it('shows Dashboard link pointing to admin dashboard', () => {
    const dashboardLinks = screen.getAllByRole('button', { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThan(0);
  });

  it('shows Requests link', () => {
    expect(screen.getByRole('button', { name: /requests/i })).toBeInTheDocument();
  });

  it('shows Contracts link', () => {
    expect(screen.getByRole('button', { name: /contracts/i })).toBeInTheDocument();
  });

  it('shows Logout button', () => {
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('does NOT show Login or Sign Up', () => {
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
  });
});

describe('Navbar — TENANT user', () => {
  beforeEach(() => renderInRouter(<Navbar />, { user: MOCK_TENANT }));

  it('shows Dashboard link', () => {
    const dashboardBtns = screen.getAllByRole('button', { name: /dashboard/i });
    expect(dashboardBtns.length).toBeGreaterThan(0);
  });

  it('shows Contracts link but NOT Requests', () => {
    expect(screen.queryByRole('button', { name: /requests/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contracts/i })).toBeInTheDocument();
  });

  it('shows Logout button', () => {
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});

describe('Navbar — VISITOR user', () => {
  beforeEach(() => renderInRouter(<Navbar />, { user: MOCK_VISITOR }));

  it('shows Dashboard link (visitor can see tenant dashboard)', () => {
    const dashboardBtns = screen.getAllByRole('button', { name: /dashboard/i });
    expect(dashboardBtns.length).toBeGreaterThan(0);
  });

  it('shows Browse link', () => {
    expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
  });
});

describe('Navbar — logout flow', () => {
  it('calls logout on confirmation', async () => {
    const mockLogout = jest.fn();
    renderInRouter(<Navbar />, {
      user: MOCK_TENANT,
      authOverrides: { logout: mockLogout },
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /logout/i }));
    
    const confirmBtn = await screen.findByRole('button', { name: /yes.*logout/i });
    await user.click(confirmBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

// src/tests/components/FavoriteButton.test.jsx
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import FavoriteButton from '../../components/FavoriteButton';
import { renderWithProviders, mockTenant } from '../helpers/renderWithProviders';

// Mock the API module
jest.mock('../../utils/api', () => ({
  propertyApi: {
    favorite: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    filter: jest.fn(),
    search: jest.fn(),
    getFavorites: jest.fn(),
    addImage: jest.fn(),
  },
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
    updateProfile: jest.fn(),
  },
  rentApi: {},
  uploadApi: { uploadOne: jest.fn() },
}));

const { propertyApi } = require('../../utils/api');

describe('FavoriteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with unfavorited state by default', () => {
    renderWithProviders(
      <FavoriteButton propertyId="1" />,
      { authValue: { user: mockTenant, isAuthenticated: true } }
    );
    const btn = screen.getByRole('button', { name: /Add to favorites/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  test('renders with favorited state when initialFavorited=true', () => {
    renderWithProviders(
      <FavoriteButton propertyId="1" initialFavorited={true} />,
      { authValue: { user: mockTenant, isAuthenticated: true } }
    );
    const btn = screen.getByRole('button', { name: /Remove from favorites/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('toggles favorite state on click when authenticated', async () => {
    propertyApi.favorite.mockResolvedValue({ data: {} });

    renderWithProviders(
      <FavoriteButton propertyId="1" initialFavorited={false} />,
      { authValue: { user: mockTenant, isAuthenticated: true } }
    );

    fireEvent.click(screen.getByRole('button', { name: /Add to favorites/i }));

    await waitFor(() => {
      expect(propertyApi.favorite).toHaveBeenCalledWith('1');
      expect(screen.getByRole('button', { name: /Remove from favorites/i })).toBeInTheDocument();
    });
  });

  test('redirects to login when unauthenticated user clicks favorite', () => {
    renderWithProviders(
      <FavoriteButton propertyId="1" />,
      { authValue: { user: null, isAuthenticated: false } }
    );
    // Click should not throw; navigation to /login happens internally
    fireEvent.click(screen.getByRole('button', { name: /Add to favorites/i }));
    // API should NOT be called
    expect(propertyApi.favorite).not.toHaveBeenCalled();
  });

  test('shows label when showLabel=true', () => {
    renderWithProviders(
      <FavoriteButton propertyId="1" showLabel={true} initialFavorited={false} />,
      { authValue: { user: mockTenant, isAuthenticated: true } }
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('shows Saved label when favorited and showLabel=true', () => {
    renderWithProviders(
      <FavoriteButton propertyId="1" showLabel={true} initialFavorited={true} />,
      { authValue: { user: mockTenant, isAuthenticated: true } }
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  test('calls onToggle callback after toggling', async () => {
    propertyApi.favorite.mockResolvedValue({ data: {} });
    const onToggle = jest.fn();

    renderWithProviders(
      <FavoriteButton propertyId="1" initialFavorited={false} onToggle={onToggle} />,
      { authValue: { user: mockTenant, isAuthenticated: true } }
    );

    fireEvent.click(screen.getByRole('button', { name: /Add to favorites/i }));

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });
});

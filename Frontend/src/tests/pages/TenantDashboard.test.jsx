// src/tests/pages/TenantDashboard.test.jsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import TenantDashboard from '../../pages/tenant/TenantDashboard';
import { renderWithProviders, mockTenant } from '../helpers/renderWithProviders';

jest.mock('../../utils/api', () => ({
  propertyApi: {
    getFavorites: jest.fn(),
    getAll: jest.fn(),
    favorite: jest.fn(),
    getById: jest.fn(),
    filter: jest.fn(),
    search: jest.fn(),
    addImage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  authApi: { login: jest.fn(), register: jest.fn(), logout: jest.fn(), getMe: jest.fn(), updateProfile: jest.fn() },
  rentApi: {
    getAllContracts: jest.fn(),
    getAllRequests: jest.fn(),
    createRequest: jest.fn(),
  },
  uploadApi: { uploadOne: jest.fn() },
}));

// Mock recently viewed utility
jest.mock('../../utils/recentlyViewed', () => ({
  getRecentlyViewed: jest.fn(() => []),
  recordRecentlyViewed: jest.fn(),
}));

const { propertyApi, rentApi } = require('../../utils/api');

describe('TenantDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    propertyApi.getFavorites.mockResolvedValue({ data: [] });
    rentApi.getAllContracts.mockResolvedValue({ data: [] });
  });

  test('renders Dashboard heading', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('Dashboard.')).toBeInTheDocument();
    });
  });

  test('renders tenant welcome message with user name', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText('Tenant User')).toBeInTheDocument();
    });
  });

  test('shows empty favorites state when no favorites', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
    });
  });

  test('shows Find New Home button', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('Find New Home')).toBeInTheDocument();
    });
  });

  test('renders stats section with Favorites, Viewed, Contracts labels', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('FAVORITES')).toBeInTheDocument();
      expect(screen.getByText('VIEWED')).toBeInTheDocument();
      expect(screen.getByText('CONTRACTS')).toBeInTheDocument();
    });
  });

  test('does NOT show Pay button — TENANT dashboard has no pay action here', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
    });
  });
});

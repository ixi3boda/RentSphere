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
  authApi: {
    login: jest.fn(), register: jest.fn(), logout: jest.fn(),
    getMe: jest.fn(), updateProfile: jest.fn(),
  },
  rentApi: {
    getAllContracts: jest.fn(),
    getAllRequests: jest.fn(),
    createRequest: jest.fn(),
  },
  uploadApi: { uploadOne: jest.fn() },
}));

jest.mock('../../utils/recentlyViewed', () => ({
  getRecentlyViewed: jest.fn(() => []),
  recordRecentlyViewed: jest.fn(),
  clearRecentlyViewed: jest.fn(),
  setRecentlyViewed: jest.fn(),
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

  test('renders welcome message with user name', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText('Tenant User')).toBeInTheDocument();
    });
  });

  test('shows empty favorites message when no favorites', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
    });
  });

  test('renders Find New Home link', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('Find New Home')).toBeInTheDocument();
    });
  });

  test('renders stat labels: Favorites, Viewed, Contracts', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      // StatBlock renders raw text — CSS makes it uppercase visually but DOM text is lowercase
      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('Viewed')).toBeInTheDocument();
      expect(screen.getByText('Contracts')).toBeInTheDocument();
    });
  });

  test('TENANT dashboard does NOT have a Pay button', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
    });
  });

  test('renders Your Favorites section heading', async () => {
    renderWithProviders(<TenantDashboard />, {
      authValue: { user: mockTenant, isAuthenticated: true, initializing: false },
    });
    await waitFor(() => {
      expect(screen.getByText('Your Favorites')).toBeInTheDocument();
    });
  });
});

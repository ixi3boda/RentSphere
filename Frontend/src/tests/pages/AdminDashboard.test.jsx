// src/tests/pages/AdminDashboard.test.jsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import { renderWithProviders, mockAdmin } from '../helpers/renderWithProviders';

jest.mock('../../utils/api', () => ({
  propertyApi: {
    getAll: jest.fn(),
    getFavorites: jest.fn(),
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
    getAllRequests: jest.fn(),
    getAllContracts: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
  },
  uploadApi: { uploadOne: jest.fn() },
}));

const { rentApi } = require('../../utils/api');

const mockProperty = {
  id: '1',
  title: 'Admin Property',
  price: 2000,
  location: 'Cairo, Maadi',
  city: 'Cairo',
  propertyType: 'apartment',
  status: 'available',
  numRooms: 3,
  areaSqm: 90,
  images: [],
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rentApi.getAllRequests.mockResolvedValue({ data: [] });
    rentApi.getAllContracts.mockResolvedValue({ data: [] });
  });

  test('renders Admin Console heading', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true, initializing: false },
      propertyValue: { properties: [], loading: false, fetchOwnerProperties: jest.fn() },
    });
    await waitFor(() => {
      expect(screen.getByText('Admin Console.')).toBeInTheDocument();
    });
  });

  test('shows empty properties state', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: { properties: [], loading: false, fetchOwnerProperties: jest.fn(), deleteProperty: jest.fn(), error: null },
    });
    await waitFor(() => {
      expect(screen.getByText('No Properties Yet')).toBeInTheDocument();
    });
  });

  test('renders property cards when properties exist', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: {
        properties: [mockProperty],
        loading: false,
        fetchOwnerProperties: jest.fn(),
        deleteProperty: jest.fn(),
        error: null,
      },
    });
    await waitFor(() => {
      expect(screen.getByText('Admin Property')).toBeInTheDocument();
    });
  });

  test('shows Add New, Requests, Contracts quick action links', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: { properties: [], loading: false, fetchOwnerProperties: jest.fn(), deleteProperty: jest.fn(), error: null },
    });
    await waitFor(() => {
      expect(screen.getByText('Add New')).toBeInTheDocument();
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('Contracts')).toBeInTheDocument();
    });
  });

  test('⚠️ ADMIN does NOT see Pay button', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: {
        properties: [mockProperty],
        loading: false,
        fetchOwnerProperties: jest.fn(),
        deleteProperty: jest.fn(),
        error: null,
      },
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
    });
  });

  test('renders Stats section labels', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: { properties: [], loading: false, fetchOwnerProperties: jest.fn(), deleteProperty: jest.fn(), error: null },
    });
    await waitFor(() => {
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  test('Edit and Delete buttons shown per property', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: {
        properties: [mockProperty],
        loading: false,
        fetchOwnerProperties: jest.fn(),
        deleteProperty: jest.fn(),
        error: null,
      },
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });
  });
});

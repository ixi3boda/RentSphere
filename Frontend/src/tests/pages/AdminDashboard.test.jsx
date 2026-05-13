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
  authApi: {
    login: jest.fn(), register: jest.fn(), logout: jest.fn(),
    getMe: jest.fn(), updateProfile: jest.fn(),
  },
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
  title: 'Admin Test Property',
  price: 2000,
  location: 'Cairo, Maadi',
  city: 'Cairo',
  propertyType: 'apartment',
  status: 'available',
  numRooms: 3,
  areaSqm: 90,
  images: [],
};

const defaultPropertyCtx = (properties = []) => ({
  properties,
  loading: false,
  error: null,
  fetchOwnerProperties: jest.fn(),
  deleteProperty: jest.fn().mockResolvedValue({ success: true }),
  createProperty: jest.fn(),
  updateProperty: jest.fn(),
  getPropertyById: jest.fn(),
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rentApi.getAllRequests.mockResolvedValue({ data: [] });
    rentApi.getAllContracts.mockResolvedValue({ data: [] });
  });

  test('renders Admin Console heading', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx(),
    });
    await waitFor(() => {
      expect(screen.getByText('Admin Console.')).toBeInTheDocument();
    });
  });

  test('shows "No Properties Yet" when property list is empty', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx([]),
    });
    await waitFor(() => {
      expect(screen.getByText('No Properties Yet')).toBeInTheDocument();
    });
  });

  test('renders property card when properties exist', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx([mockProperty]),
    });
    await waitFor(() => {
      expect(screen.getByText('Admin Test Property')).toBeInTheDocument();
    });
  });

  test('renders Add New quick action link', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx(),
    });
    await waitFor(() => {
      expect(screen.getByText('Add New')).toBeInTheDocument();
    });
  });

  test('renders Requests and Contracts quick action links', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx(),
    });
    await waitFor(() => {
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('Contracts')).toBeInTheDocument();
    });
  });

  test('⚠️ ADMIN does NOT see a Pay button', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx([mockProperty]),
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
    });
  });

  test('Edit and Delete buttons appear for each property', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx([mockProperty]),
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });
  });

  test('Stats section renders Properties label', async () => {
    renderWithProviders(<AdminDashboard />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
      propertyValue: defaultPropertyCtx(),
    });
    await waitFor(() => {
      // StatsCard renders label with uppercase tracking via CSS; DOM text is normal case
      expect(screen.getByText('Properties')).toBeInTheDocument();
    });
  });
});

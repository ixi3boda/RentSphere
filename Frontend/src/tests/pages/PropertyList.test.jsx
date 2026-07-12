// src/tests/pages/PropertyList.test.jsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import PropertyList from '../../pages/PropertyList';
import { renderWithProviders } from '../helpers/renderWithProviders';

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
  rentApi: {},
  uploadApi: { uploadOne: jest.fn() },
}));

const { propertyApi } = require('../../utils/api');

const makeBackendProperty = (id, title, city = 'Cairo', price = 1000) => ({
  property: {
    propertyId: id,
    title,
    city,
    district: 'Downtown',
    address: '123 Test St',
    propertyType: 'APARTMENT',
    pricePerMonth: price,
    numRooms: 2,
    areaSqm: 60,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  propertyImages: [],
  coverPic: null,
});

describe('PropertyList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    propertyApi.getFavorites.mockResolvedValue({ data: [] });
  });

  test('renders the main page heading', async () => {
    propertyApi.getAll.mockResolvedValue({ data: [] });
    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
  });

  test('renders search input', async () => {
    propertyApi.getAll.mockResolvedValue({ data: [] });
    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });
    expect(screen.getByPlaceholderText(/Where are you looking/i)).toBeInTheDocument();
  });

  test('renders property cards after data loads', async () => {
    propertyApi.getAll.mockResolvedValue({
      data: [
        makeBackendProperty(1, 'Luxury Villa'),
        makeBackendProperty(2, 'Cozy Studio'),
      ],
    });

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
      expect(screen.getByText('Cozy Studio')).toBeInTheDocument();
    });
  });

  test('shows "No Properties Found" when list is empty', async () => {
    propertyApi.getAll.mockResolvedValue({ data: [] });

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText('No Properties Found')).toBeInTheDocument();
    });
  });

  test('shows error message when API call fails', async () => {
    propertyApi.getAll.mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('shows Found N properties count', async () => {
    propertyApi.getAll.mockResolvedValue({
      data: [makeBackendProperty(1, 'One Bedroom Flat')],
    });

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText(/Found/i)).toBeInTheDocument();
    });
  });
});

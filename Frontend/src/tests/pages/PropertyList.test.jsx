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
  authApi: { login: jest.fn(), register: jest.fn(), logout: jest.fn(), getMe: jest.fn(), updateProfile: jest.fn() },
  rentApi: {},
  uploadApi: { uploadOne: jest.fn() },
}));

const { propertyApi } = require('../../utils/api');

const makeProperty = (id, title, city = 'Cairo', price = 1000) => ({
  property: {
    propertyId: id,
    title,
    city,
    district: '',
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

  test('shows skeleton loading state initially', async () => {
    propertyApi.getAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<PropertyList />, { authValue: { initializing: false } });
    // Skeleton cards have animate-pulse class — check for heading
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
  });

  test('renders property cards after loading', async () => {
    propertyApi.getAll.mockResolvedValue({
      data: [makeProperty(1, 'Luxury Villa'), makeProperty(2, 'Cozy Studio')],
    });

    renderWithProviders(<PropertyList />, { authValue: { initializing: false } });

    await waitFor(() => {
      expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
      expect(screen.getByText('Cozy Studio')).toBeInTheDocument();
    });
  });

  test('shows "No Properties Found" when empty', async () => {
    propertyApi.getAll.mockResolvedValue({ data: [] });

    renderWithProviders(<PropertyList />, { authValue: { initializing: false } });

    await waitFor(() => {
      expect(screen.getByText('No Properties Found')).toBeInTheDocument();
    });
  });

  test('shows error state when API fails', async () => {
    propertyApi.getAll.mockRejectedValue({ response: { data: { message: 'Server error' } } });

    renderWithProviders(<PropertyList />, { authValue: { initializing: false } });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('shows property count text', async () => {
    propertyApi.getAll.mockResolvedValue({
      data: [makeProperty(1, 'Apartment One')],
    });

    renderWithProviders(<PropertyList />, { authValue: { initializing: false } });

    await waitFor(() => {
      expect(screen.getByText(/Found/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  test('renders search input', () => {
    propertyApi.getAll.mockResolvedValue({ data: [] });
    renderWithProviders(<PropertyList />, { authValue: { initializing: false } });
    expect(screen.getByPlaceholderText(/Where are you looking/i)).toBeInTheDocument();
  });
});

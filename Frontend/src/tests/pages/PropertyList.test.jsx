// src/tests/pages/PropertyList.test.jsx
import React from 'react';
import { screen, waitFor, within, act } from '@testing-library/react';
import PropertyList from '../../pages/PropertyList';
import { renderWithProviders } from '../helpers/renderWithProviders';

jest.mock('../../utils/api', () => ({
  propertyApi: {
    getFavorites: jest.fn(),
    favorite: jest.fn(),
    getById: jest.fn(),
    filter: jest.fn(),
    getCities: jest.fn(),
    getMarketplaceStats: jest.fn(),
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

const pageOf = (items, total = items.length) => ({
  data: { items, total, page: 0, size: 9 },
});

// The page fires three independent requests on mount (cities, listings, favorites). Their setState
// callbacks land after the assertion below unless the test yields to the microtask queue first.
const flushPendingRequests = () => act(async () => {});

describe('PropertyList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    propertyApi.getFavorites.mockResolvedValue({ data: [] });
    propertyApi.getCities.mockResolvedValue({ data: ['Cairo', 'Giza'] });
    propertyApi.filter.mockResolvedValue(pageOf([]));
  });

  test('renders the main page heading', async () => {
    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });
    await flushPendingRequests();
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
  });

  test('renders search input', async () => {
    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });
    await flushPendingRequests();
    expect(screen.getByPlaceholderText(/Where are you looking/i)).toBeInTheDocument();
  });

  test('renders property cards after data loads', async () => {
    propertyApi.filter.mockResolvedValue(pageOf([
      makeBackendProperty(1, 'Luxury Villa'),
      makeBackendProperty(2, 'Cozy Studio'),
    ]));

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
      expect(screen.getByText('Cozy Studio')).toBeInTheDocument();
    });
    await flushPendingRequests();
  });

  test('shows "No Properties Found" when list is empty', async () => {
    propertyApi.filter.mockResolvedValue(pageOf([]));

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText('No Properties Found')).toBeInTheDocument();
    });
    await flushPendingRequests();
  });

  test('shows error message when API call fails', async () => {
    propertyApi.filter.mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    await flushPendingRequests();
  });

  test('shows the server total, not just the current page size', async () => {
    propertyApi.filter.mockResolvedValue(pageOf([makeBackendProperty(1, 'One Bedroom Flat')], 1234));

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => {
      expect(screen.getByText(/Found/i)).toBeInTheDocument();
    });
    expect(screen.getByText('1,234')).toBeInTheDocument();
    await flushPendingRequests();
  });

  test('applies the query string handed over by the Hero search bar', async () => {
    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
      route: '/properties?city=Cairo&type=villa&maxPrice=2000',
    });

    await waitFor(() => {
      expect(propertyApi.filter).toHaveBeenCalledWith({
        search: undefined,
        city: 'Cairo',
        propertyType: 'villa',
        maxPrice: 2000,
        sortBy: 'newest',
        page: 0,
        size: 9,
      });
    });
    await flushPendingRequests();
  });

  test('loads the city dropdown from the backend instead of the visible page', async () => {
    propertyApi.filter.mockResolvedValue(pageOf([makeBackendProperty(1, 'Only Listing', 'Cairo')]));

    renderWithProviders(<PropertyList />, {
      authValue: { isAuthenticated: false, initializing: false },
    });

    await waitFor(() => expect(propertyApi.getCities).toHaveBeenCalled());

    // Giza is not on the returned page, so it can only appear if the options came from the API.
    const citySelect = screen.getByLabelText(/^city$/i);
    expect(within(citySelect).getByRole('option', { name: 'Giza' })).toBeInTheDocument();
    await flushPendingRequests();
  });
});

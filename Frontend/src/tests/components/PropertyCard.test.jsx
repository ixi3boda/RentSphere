// src/tests/components/PropertyCard.test.jsx
import React from 'react';
import { screen } from '@testing-library/react';
import PropertyCard from '../../components/PropertyCard';
import { renderWithProviders } from '../helpers/renderWithProviders';

// Mock API so FavoriteButton (rendered inside PropertyCard) doesn't break
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
    login: jest.fn(), register: jest.fn(), logout: jest.fn(),
    getMe: jest.fn(), updateProfile: jest.fn(),
  },
  rentApi: {},
  uploadApi: { uploadOne: jest.fn() },
}));

const mockProperty = {
  id: '1',
  title: 'Modern Downtown Apartment',
  price: 1200,
  location: 'New York, Manhattan',
  city: 'New York',
  propertyType: 'apartment',
  status: 'available',
  numRooms: 3,
  areaSqm: 85,
  images: [],
};

const mockPropertyWithImage = {
  ...mockProperty,
  id: '2',
  images: ['data:image/png;base64,fakebase64=='],
};

describe('PropertyCard', () => {
  test('renders property title', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
  });

  test('renders price with /mo suffix', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText(/\/mo/i)).toBeInTheDocument();
  });

  test('renders location text', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/New York/i)).toBeInTheDocument();
  });

  test('renders status badge with capitalized status', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  test('renders property type label', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Apartment')).toBeInTheDocument();
  });

  test('does NOT render img element when images array is empty', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    const cardImg = screen.queryByAltText('Modern Downtown Apartment');
    expect(cardImg).not.toBeInTheDocument();
  });

  test('renders img element when images array has a URL', () => {
    renderWithProviders(<PropertyCard property={mockPropertyWithImage} />);
    const img = screen.getByAltText('Modern Downtown Apartment');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('data:image');
  });

  test('renders room count in overlay area', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/3 Rooms/i)).toBeInTheDocument();
  });
});

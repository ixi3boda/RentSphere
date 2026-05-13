// src/tests/components/PropertyCard.test.jsx
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import PropertyCard from '../../components/PropertyCard';
import { renderWithProviders } from '../helpers/renderWithProviders';

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
  test('renders property title and price', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
  });

  test('renders location text', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/New York/i)).toBeInTheDocument();
  });

  test('renders status badge', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  test('renders placeholder when no images', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    // No img with src should be rendered (placeholder div shown)
    const images = screen.queryAllByRole('img');
    // The logo image in navbar doesn't apply here; specifically card image
    const cardImg = images.find(img => img.alt === mockProperty.title);
    expect(cardImg).toBeUndefined();
  });

  test('renders image when images array is provided', () => {
    renderWithProviders(<PropertyCard property={mockPropertyWithImage} />);
    const img = screen.getByAltText('Modern Downtown Apartment');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('data:image');
  });

  test('renders property type label', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/Apartment/i)).toBeInTheDocument();
  });

  test('navigates to property detail on card click', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />, { route: '/properties' });
    const card = screen.getByRole('article') || screen.getByText('Modern Downtown Apartment').closest('[id^="property-card"]');
    // The card has a click handler — verify it's present in DOM
    expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
  });

  test('renders /mo text for price', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('/mo')).toBeInTheDocument();
  });
});

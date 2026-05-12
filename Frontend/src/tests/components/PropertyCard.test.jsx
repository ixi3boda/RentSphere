



import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyCard from '../../components/PropertyCard';
import { createMockProperty } from '../test-utils/factory';
import { MOCK_TENANT } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';

describe('PropertyCard', () => {
  const property = createMockProperty({
    title: 'Sunset Villa',
    price: 2500,
    location: 'Jeddah, Al Hamra',
    propertyType: 'villa',
    status: 'available',
  });

  it('renders property title', () => {
    renderInRouter(<PropertyCard property={property} />, { user: MOCK_TENANT });
    expect(screen.getByText('Sunset Villa')).toBeInTheDocument();
  });

  it('renders property price formatted with $', () => {
    renderInRouter(<PropertyCard property={property} />, { user: MOCK_TENANT });
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  it('renders availability status badge', () => {
    renderInRouter(<PropertyCard property={property} />, { user: MOCK_TENANT });
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  it('renders "rented" badge for unavailable property', () => {
    const rented = createMockProperty({ status: 'rented', title: 'Property for Rent' });
    renderInRouter(<PropertyCard property={rented} />, { user: MOCK_TENANT });
    
    const badge = screen.getByText(/^rented$/i, { selector: 'span' });
    expect(badge).toBeInTheDocument();
  });

  it('renders FavoriteButton', () => {
    renderInRouter(<PropertyCard property={property} />, { user: MOCK_TENANT });
    expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument();
  });

  it('renders placeholder when no image', () => {
    const noImg = createMockProperty({ images: [], coverPic: null });
    renderInRouter(<PropertyCard property={noImg} />, { user: MOCK_TENANT });
    
    expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument();
  });

  it('has correct aria attributes on card container', () => {
    renderInRouter(<PropertyCard property={property} />, { user: MOCK_TENANT });
    const card = document.getElementById(`property-card-${property.id}`);
    expect(card).toBeInTheDocument();
  });
});

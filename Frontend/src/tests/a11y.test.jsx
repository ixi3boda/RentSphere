// src/tests/a11y.test.jsx
// Automated a11y checks for the pieces that carry the most interactive labels.
// jest-axe runs in jsdom, which has no CSS cascade, so it can only judge structure
// (names, roles, headings, landmarks). Colour contrast is measured for real in the
// browser by scripts/contrast-audit.js and is disabled here to avoid false green.
import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithProviders, mockAdmin } from './helpers/renderWithProviders';
import PropertyCard from '../components/PropertyCard';
import StatsCard from '../components/StatsCard';
import ImageCarousel from '../components/ImageCarousel';
import PropertyList from '../pages/PropertyList';
import RentalRequestsPage from '../pages/admin/RentalRequestsPage';

expect.extend(toHaveNoViolations);

jest.mock('../utils/api', () => ({
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
  rentApi: {
    getAllRequests: jest.fn(),
    getRequestSummary: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
  },
  authApi: {
    login: jest.fn(), register: jest.fn(), logout: jest.fn(),
    getMe: jest.fn(), updateProfile: jest.fn(),
  },
  uploadApi: { uploadOne: jest.fn() },
}));

const { propertyApi, rentApi } = require('../utils/api');

const axeOptions = { rules: { 'color-contrast': { enabled: false } } };
const flush = () => act(async () => {});

// PropertyCard renders an already-normalised property; the list page normalises itself.
const cardProperty = {
  id: '1',
  title: 'Sea-view Loft',
  price: 1800,
  location: 'Cairo, Zamalek',
  city: 'Cairo',
  propertyType: 'apartment',
  status: 'available',
  numRooms: 2,
  areaSqm: 88,
  images: [],
};

const backendProperty = (id) => ({
  property: {
    propertyId: id,
    title: `Sea-view Loft ${id}`,
    city: 'Cairo',
    district: 'Zamalek',
    address: '9 Nile St',
    propertyType: 'APARTMENT',
    pricePerMonth: 1800,
    numRooms: 2,
    areaSqm: 88,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  propertyImages: [],
  coverPic: null,
});

describe('accessibility structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    propertyApi.getFavorites.mockResolvedValue({ data: [] });
    propertyApi.getCities.mockResolvedValue({ data: ['Cairo'] });
    propertyApi.filter.mockResolvedValue({
      data: { items: [backendProperty(1), backendProperty(2)], total: 22501, page: 0, size: 9 },
    });
    rentApi.getAllRequests.mockResolvedValue({
      data: {
        items: [{
          rentalReqId: 1, propertyId: 11, tenantId: 5, reqStatus: 'PENDING',
          desiredStart: '2026-05-01', desiredMonths: 12, message: 'Interested',
          createdAt: '2026-09-20T10:00:00', reviewedAt: null,
        }],
        total: 1, page: 0, size: 12,
      },
    });
    rentApi.getRequestSummary.mockResolvedValue({
      data: { total: 30001, PENDING: 7500, ACCEPTED: 7501, REJECTED: 7500, CANCELLED: 7500 },
    });
  });

  it('PropertyCard has no violations', async () => {
    const { container } = renderWithProviders(<PropertyCard property={cardProperty} />);
    await flush();
    expect(await axe(container, axeOptions)).toHaveNoViolations();
  });

  it('StatsCard groups thousands and stays labellable', async () => {
    const { container } = renderWithProviders(
      <StatsCard icon="🏠" label="Total listings" value={100001} accent="sky" />
    );
    expect(await axe(container, axeOptions)).toHaveNoViolations();
    expect(screen.getByText('100,001')).toBeInTheDocument();
  });

  it('ImageCarousel names every control', async () => {
    const { container } = renderWithProviders(<ImageCarousel images={['/a.jpg', '/b.jpg']} />);
    expect(await axe(container, axeOptions)).toHaveNoViolations();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
  });

  it('ImageCarousel empty state still says what it is', async () => {
    const { container } = renderWithProviders(<ImageCarousel images={[]} />);
    expect(await axe(container, axeOptions)).toHaveNoViolations();
    expect(screen.getByText('No photo yet')).toBeInTheDocument();
  });

  it('PropertyList paginates without violations', async () => {
    const { container } = renderWithProviders(<PropertyList />);
    await flush();
    await waitFor(() => expect(screen.getByText('Sea-view Loft 1')).toBeInTheDocument());
    expect(await axe(container, axeOptions)).toHaveNoViolations();
    expect(screen.getByRole('navigation', { name: 'Property pages' })).toBeInTheDocument();
  });

  it('RentalRequestsPage status tiles are named toggles without violations', async () => {
    const { container } = renderWithProviders(
      <RentalRequestsPage />,
      { authValue: { user: mockAdmin, isAuthenticated: true } }
    );
    await flush();
    await waitFor(() => expect(screen.getByText('30,001')).toBeInTheDocument());
    expect(await axe(container, axeOptions)).toHaveNoViolations();
    expect(screen.getByRole('button', { name: /Pending/i })).toHaveAttribute('aria-pressed');
  });
});

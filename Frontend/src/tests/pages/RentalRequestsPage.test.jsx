// src/tests/pages/RentalRequestsPage.test.jsx
import React from 'react';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RentalRequestsPage from '../../pages/admin/RentalRequestsPage';
import { renderWithProviders, mockAdmin } from '../helpers/renderWithProviders';

jest.mock('../../utils/api', () => ({
  propertyApi: { getMarketplaceStats: jest.fn() },
  rentApi: {
    getAllRequests: jest.fn(),
    getRequestSummary: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
  },
  authApi: { login: jest.fn(), register: jest.fn(), logout: jest.fn(), getMe: jest.fn(), updateProfile: jest.fn() },
  uploadApi: { uploadOne: jest.fn() },
}));

const { rentApi } = require('../../utils/api');

// The page fires a list and a summary request together; both setState callbacks land after the
// first assertion unless the test yields to the microtask queue.
const flushPendingRequests = () => act(async () => {});

const makeRequest = (id, reqStatus) => ({
  rentalReqId: id,
  propertyId: id * 10,
  tenantId: 5,
  reqStatus,
  desiredStart: '2026-05-01',
  desiredMonths: 12,
  message: 'Interested in this unit',
  createdAt: '2026-09-20T10:00:00',
  reviewedAt: null,
});

const pageOf = (items, total = items.length) => ({
  data: { items, total, page: 0, size: 12 },
});

const summaryOf = (overrides = {}) => ({
  data: { total: 30001, PENDING: 7500, ACCEPTED: 7501, REJECTED: 7500, CANCELLED: 7500, ...overrides },
});

const renderPage = () =>
  renderWithProviders(<RentalRequestsPage />, {
    authValue: { user: mockAdmin, isAuthenticated: true, initializing: false },
  });

beforeEach(() => {
  jest.clearAllMocks();
  rentApi.getAllRequests.mockResolvedValue(pageOf([makeRequest(30000, 'PENDING')]));
  rentApi.getRequestSummary.mockResolvedValue(summaryOf());
});

test('asks the backend for one page instead of every request', async () => {
  rentApi.getAllRequests.mockResolvedValue(pageOf(
    [makeRequest(30000, 'PENDING')],
    30001,
  ));
  renderPage();
  await flushPendingRequests();

  await waitFor(() => {
    expect(rentApi.getAllRequests).toHaveBeenCalledWith({ status: undefined, page: 0, size: 12 });
  });
  expect(screen.getByText(/Showing 1–1 of 30,001 requests/)).toBeInTheDocument();
});

test('status cards show the server totals, not the loaded page', async () => {
  renderPage();
  await flushPendingRequests();

  expect(screen.getByText('30,001')).toBeInTheDocument();
  expect(screen.getAllByText('7,500')).toHaveLength(3);
  expect(screen.getByText('7,501')).toBeInTheDocument();
});

test('filtering by status re-queries the server and resets to the first page', async () => {
  renderPage();
  await flushPendingRequests();

  await userEvent.click(screen.getByRole('button', { name: /Pending/ }));
  await flushPendingRequests();

  expect(rentApi.getAllRequests).toHaveBeenLastCalledWith({ status: 'PENDING', page: 0, size: 12 });
});

test('accepting a request posts the id and re-reads the page', async () => {
  rentApi.acceptRequest.mockResolvedValue({ data: { reqStatus: 'ACCEPTED' } });
  renderPage();
  await flushPendingRequests();

  await userEvent.click(screen.getByText(/✅ Accept/));
  await userEvent.click(await screen.findByText('✅ Yes, Accept'));
  await flushPendingRequests();

  expect(rentApi.acceptRequest).toHaveBeenCalledWith(30000);
  // Three reads: initial load, plus the re-read that keeps the totals honest.
  expect(rentApi.getAllRequests).toHaveBeenCalledTimes(2);
});

test('a failed accept leaves the list untouched and reports the failure', async () => {
  rentApi.acceptRequest.mockRejectedValue({ response: { data: { message: 'Not allowed' } } });
  renderPage();
  await flushPendingRequests();

  await userEvent.click(screen.getByText(/✅ Accept/));
  await userEvent.click(await screen.findByText('✅ Yes, Accept'));
  await flushPendingRequests();

  expect(screen.getByText('❌ Not allowed')).toBeInTheDocument();
  expect(screen.getByText(/⏳ PENDING/)).toBeInTheDocument();
  expect(screen.queryByText(/✅ ACCEPTED/)).not.toBeInTheDocument();
});

test('rejecting a request posts the id', async () => {
  rentApi.rejectRequest.mockResolvedValue({ data: { reqStatus: 'REJECTED' } });
  renderPage();
  await flushPendingRequests();

  await userEvent.click(screen.getByText(/❌ Reject/));
  await userEvent.click(await screen.findByText('❌ Yes, Reject'));
  await flushPendingRequests();

  expect(rentApi.rejectRequest).toHaveBeenCalledWith(30000);
});

test('an empty page renders the empty state rather than a phantom total', async () => {
  rentApi.getAllRequests.mockResolvedValue(pageOf([], 0));
  rentApi.getRequestSummary.mockResolvedValue(summaryOf({ total: 0, PENDING: 0, ACCEPTED: 0, REJECTED: 0, CANCELLED: 0 }));
  renderPage();
  await flushPendingRequests();

  await waitFor(() => expect(screen.getByText('No requests yet')).toBeInTheDocument());
  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
});

test('a failed list load surfaces the error instead of an empty page', async () => {
  rentApi.getAllRequests.mockRejectedValue({ response: { data: { message: 'Failed to fetch rental requests' } } });
  renderPage();
  await flushPendingRequests();

  await waitFor(() =>
    expect(screen.getByText('Failed to fetch rental requests')).toBeInTheDocument());
});

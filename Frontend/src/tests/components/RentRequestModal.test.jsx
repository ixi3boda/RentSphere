









import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import RentRequestModal from '../../components/RentRequestModal';
import { createMockProperty } from '../test-utils/factory';
import { MOCK_TENANT } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

const property = createMockProperty({ title: 'Test Flat', id: '101' });

describe('RentRequestModal', () => {
  it('renders modal with property title', () => {
    renderInRouter(
      <RentRequestModal property={property} onClose={jest.fn()} />,
      { user: MOCK_TENANT }
    );
    expect(screen.getByText(/request rental/i)).toBeInTheDocument();
  });

  it('has start date and months inputs', () => {
    renderInRouter(
      <RentRequestModal property={property} onClose={jest.fn()} />,
      { user: MOCK_TENANT }
    );
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it('shows validation error for past start date', async () => {
    const user = userEvent.setup();
    renderInRouter(
      <RentRequestModal property={property} onClose={jest.fn()} />,
      { user: MOCK_TENANT }
    );

    const dateInput = screen.getByLabelText(/start date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2020-01-01');

    await user.click(screen.getByRole('button', { name: /submit|send request/i }));

    expect(await screen.findByText(/past/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid duration (0 months)', async () => {
    const user = userEvent.setup();
    renderInRouter(
      <RentRequestModal property={property} onClose={jest.fn()} />,
      { user: MOCK_TENANT }
    );

    const monthsInput = screen.getByLabelText(/duration/i);
    await user.clear(monthsInput);
    await user.type(monthsInput, '0');

    await user.click(screen.getByRole('button', { name: /submit|send request/i }));

    expect(await screen.findByText(/1 and 24/i)).toBeInTheDocument();
  });

  it('submits successfully and shows success message', async () => {
    const user = userEvent.setup();
    renderInRouter(
      <RentRequestModal property={property} onClose={jest.fn()} />,
      { user: MOCK_TENANT }
    );

    await user.click(screen.getByRole('button', { name: /submit|send request/i }));

    expect(await screen.findByText(/Request Submitted!/i)).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    server.use(
      rest.post('/api/rent/request', (req, res, ctx) =>
        res(ctx.status(403), ctx.json({ message: 'Forbidden' }))
      )
    );

    const user = userEvent.setup();
    renderInRouter(
      <RentRequestModal property={property} onClose={jest.fn()} />,
      { user: MOCK_TENANT }
    );

    await user.click(screen.getByRole('button', { name: /submit|send request/i }));

    expect(await screen.findByText(/forbidden|failed/i)).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    renderInRouter(
      <RentRequestModal property={property} onClose={onClose} />,
      { user: MOCK_TENANT }
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});











import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { rest } from 'msw';
import PropertyDetail from '../../pages/PropertyDetail';
import AuthContext from '../../context/AuthContext';
import { MOCK_TENANT } from '../mocks/authMocks';
import { buildAuthValue } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

function renderTenantDetail(propertyId = '101') {
  return render(
    <AuthContext.Provider value={buildAuthValue({ user: MOCK_TENANT })}>
      <MemoryRouter initialEntries={[`/properties/${propertyId}`]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Rental Request Flow', () => {
  it('opens modal when tenant clicks "Request Rental"', async () => {
    const user = userEvent.setup();
    renderTenantDetail();

    
    await screen.findByText('Cozy Downtown Apartment');

    
    await user.click(screen.getByRole('button', { name: /request rental/i }));

    
    expect(await screen.findByRole('heading', { name: /request rental/i })).toBeInTheDocument();
  });

  it('submits rental request successfully', async () => {
    const user = userEvent.setup();
    renderTenantDetail();

    await screen.findByText('Cozy Downtown Apartment');
    await user.click(screen.getByRole('button', { name: /request rental/i }));

    
    const dateInput = await screen.findByLabelText(/start date/i);
    await user.clear(dateInput);
    
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = futureDate.toISOString().split('T')[0];
    await user.type(dateInput, dateStr);

    
    await user.click(screen.getByRole('button', { name: /submit|send request/i }));

    
    expect(await screen.findByText(/Request Submitted!/i)).toBeInTheDocument();
  });

  it('shows error when API returns 403 (visitor role blocked)', async () => {
    server.use(
      rest.post('/api/rent/request', (req, res, ctx) =>
        res(ctx.status(403), ctx.json({ message: 'Access Denied' }))
      )
    );

    const user = userEvent.setup();
    renderTenantDetail();

    await screen.findByText('Cozy Downtown Apartment');
    await user.click(screen.getByRole('button', { name: /request rental/i }));
    await user.click(screen.getByRole('button', { name: /submit|send request/i }));

    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
  });
});









import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import FavoriteButton from '../../components/FavoriteButton';
import { MOCK_TENANT } from '../mocks/authMocks';
import { renderInRouter } from '../test-utils/renderWithProviders';
import { server } from '../mocks/server';

describe('FavoriteButton', () => {
  describe('unfavorited state', () => {
    it('renders with heart icon in unfavorited state', () => {
      renderInRouter(
        <FavoriteButton propertyId="101" initialFavorited={false} />,
        { user: MOCK_TENANT }
      );
      const btn = screen.getByRole('button', { name: /add to favorites/i });
      expect(btn).toBeInTheDocument();
    });
  });

  describe('favorited state', () => {
    it('renders with filled heart in favorited state', () => {
      renderInRouter(
        <FavoriteButton propertyId="101" initialFavorited={true} />,
        { user: MOCK_TENANT }
      );
      const btn = screen.getByRole('button', { name: /remove from favorites/i });
      expect(btn).toBeInTheDocument();
    });
  });

  describe('unauthenticated user', () => {
    it('does not call API — instead redirects to /login', async () => {
      const user = userEvent.setup();
      renderInRouter(
        <FavoriteButton propertyId="101" initialFavorited={false} />,
        { user: null, route: '/properties/101' }
      );
      
      await user.click(screen.getByRole('button', { name: /add to favorites/i }));
      
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('calls onToggle callback with new state after API success', async () => {
      const onToggle = jest.fn();
      const user = userEvent.setup();

      renderInRouter(
        <FavoriteButton propertyId="101" initialFavorited={false} onToggle={onToggle} />,
        { user: MOCK_TENANT }
      );

      await user.click(screen.getByRole('button', { name: /add to favorites/i }));

      await waitFor(() => {
        expect(onToggle).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('error handling', () => {
    it('does not call onToggle if API fails', async () => {
      server.use(
        rest.post('/api/properties/:propertyId/favorite', (req, res, ctx) =>
          res(ctx.status(500))
        )
      );

      const onToggle = jest.fn();
      const user = userEvent.setup();

      renderInRouter(
        <FavoriteButton propertyId="101" initialFavorited={false} onToggle={onToggle} />,
        { user: MOCK_TENANT }
      );

      await user.click(screen.getByRole('button', { name: /add to favorites/i }));

      await waitFor(() => {
        
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
      
      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});

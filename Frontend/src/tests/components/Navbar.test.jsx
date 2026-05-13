// src/tests/components/Navbar.test.jsx
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Navbar from '../../components/Navbar';
import { renderWithProviders, mockAdmin, mockTenant } from '../helpers/renderWithProviders';

describe('Navbar', () => {
  test('renders logo and Browse link for unauthenticated user', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/RentSphere/i)).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  test('shows Login and Get Started buttons when not authenticated', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  test('shows Logout button when authenticated', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('shows admin Dashboard link for admin user', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
  });

  test('shows tenant Dashboard link for tenant user', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('clicking Logout opens confirmation modal', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to log out/i)).toBeInTheDocument();
  });

  test('logout modal Cancel button closes the dialog', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    fireEvent.click(screen.getByText('Logout'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });

  test('confirmed logout calls logout function', () => {
    const mockLogout = jest.fn();
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true, logout: mockLogout },
    });
    fireEvent.click(screen.getByText('Logout'));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

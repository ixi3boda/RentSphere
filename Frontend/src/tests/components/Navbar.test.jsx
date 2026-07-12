// src/tests/components/Navbar.test.jsx
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Navbar from '../../components/Navbar';
import { renderWithProviders, mockAdmin, mockTenant } from '../helpers/renderWithProviders';

describe('Navbar', () => {
  test('renders RentSphere brand text', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/RentSphere/i)).toBeInTheDocument();
  });

  test('renders Browse link for all users', () => {
    renderWithProviders(<Navbar />);
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
    // There is exactly one Logout button in the nav (before modal opens)
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('shows Dashboard link for admin user', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockAdmin, isAuthenticated: true },
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
  });

  test('shows Dashboard link for tenant user', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('clicking Logout button opens confirmation modal', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to log out/i)).toBeInTheDocument();
  });

  test('clicking Cancel in logout modal hides the modal', () => {
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true },
    });
    fireEvent.click(screen.getByText('Logout'));
    // Cancel button is inside the modal
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });

  test('confirmed logout calls the logout function', () => {
    const mockLogout = jest.fn();
    renderWithProviders(<Navbar />, {
      authValue: { user: mockTenant, isAuthenticated: true, logout: mockLogout },
    });
    // Open modal
    fireEvent.click(screen.getByText('Logout'));
    // The modal renders a second "Logout" button — getAllByText returns both;
    // the last one is the modal confirm button
    const logoutBtns = screen.getAllByText('Logout');
    fireEvent.click(logoutBtns[logoutBtns.length - 1]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

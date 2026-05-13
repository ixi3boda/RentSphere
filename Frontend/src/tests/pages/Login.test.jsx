// src/tests/pages/Login.test.jsx
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/Login';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('Login page', () => {
  test('renders email and password fields', () => {
    renderWithProviders(<Login />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('renders Sign In button', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows Create Account link', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });
    renderWithProviders(<Login />, {
      authValue: { login: mockLogin, loading: false },
    });

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('calls login with entered credentials on submit', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    renderWithProviders(<Login />, {
      authValue: { login: mockLogin, loading: false },
    });

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123', false);
    });
  });

  test('stay signed-in checkbox toggles', () => {
    renderWithProviders(<Login />);
    const checkbox = screen.getByRole('checkbox', { name: /Stay signed in/i });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

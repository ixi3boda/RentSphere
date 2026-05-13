// src/tests/helpers/renderWithProviders.js
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { PropertyContext } from '../../context/PropertyContext';

// Default mock user shapes
export const mockVisitor = {
  id: 1, email: 'visitor@test.com', name: 'Visitor User',
  role: 'visitor', role_name: 'VISITOR',
};

export const mockTenant = {
  id: 2, email: 'tenant@test.com', name: 'Tenant User',
  role: 'tenant', role_name: 'TENANT',
};

export const mockAdmin = {
  id: 3, email: 'admin@test.com', name: 'Admin User',
  role: 'admin', role_name: 'ADMIN',
};

// Default auth context value (unauthenticated)
export const defaultAuthValue = {
  user: null,
  isAuthenticated: false,
  initializing: false,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
};

// Default property context value
export const defaultPropertyValue = {
  properties: [],
  loading: false,
  error: null,
  fetchOwnerProperties: jest.fn(),
  getPropertyById: jest.fn(),
  createProperty: jest.fn(),
  updateProperty: jest.fn(),
  deleteProperty: jest.fn(),
};

/**
 * Renders a component wrapped with MemoryRouter, AuthContext, and PropertyContext.
 *
 * @param {React.ReactElement} ui
 * @param {{ authValue?, propertyValue?, route? }} options
 */
export function renderWithProviders(ui, { authValue = {}, propertyValue = {}, route = '/' } = {}) {
  const auth = { ...defaultAuthValue, ...authValue };
  const property = { ...defaultPropertyValue, ...propertyValue };

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={auth}>
        <PropertyContext.Provider value={property}>
          {ui}
        </PropertyContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

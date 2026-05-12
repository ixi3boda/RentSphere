





export const RAW_ADMIN_USER = {
  user_id: 1,
  email: 'admin@rentsphere.com',
  username: 'adminuser',
  full_name: 'Admin User',
  mobile_number: '0501234567',
  avatar_url: null,
  role_name: 'ADMIN',
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
};

export const RAW_TENANT_USER = {
  user_id: 2,
  email: 'tenant@rentsphere.com',
  username: 'tenantuser',
  full_name: 'Tenant User',
  mobile_number: '0509876543',
  avatar_url: null,
  role_name: 'TENANT',
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
};

export const RAW_VISITOR_USER = {
  user_id: 3,
  email: 'visitor@rentsphere.com',
  username: 'visitoruser',
  full_name: 'Visitor User',
  mobile_number: null,
  avatar_url: null,
  role_name: 'VISITOR',
  is_active: true,
  created_at: '2024-01-01T00:00:00',
  updated_at: '2024-01-01T00:00:00',
};


export const MOCK_ADMIN = {
  id: 1,
  email: 'admin@rentsphere.com',
  name: 'Admin User',
  username: 'adminuser',
  role: 'admin',
  role_name: 'ADMIN',
  avatar: null,
  phone: '0501234567',
  active: true,
};

export const MOCK_TENANT = {
  id: 2,
  email: 'tenant@rentsphere.com',
  name: 'Tenant User',
  username: 'tenantuser',
  role: 'tenant',
  role_name: 'TENANT',
  avatar: null,
  phone: '0509876543',
  active: true,
};

export const MOCK_VISITOR = {
  id: 3,
  email: 'visitor@rentsphere.com',
  name: 'Visitor User',
  username: 'visitoruser',
  role: 'visitor',
  role_name: 'VISITOR',
  avatar: null,
  phone: null,
  active: true,
};


export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.mock.token';

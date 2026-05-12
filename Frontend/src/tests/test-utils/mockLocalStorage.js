





import { MOCK_TOKEN, MOCK_TENANT, MOCK_ADMIN } from '../mocks/authMocks';



export const seedLocalStorage = (user = MOCK_TENANT, token = MOCK_TOKEN) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const seedSessionStorage = (user = MOCK_TENANT, token = MOCK_TOKEN) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
};

export const clearStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
};

export const getStoredToken = (storage = 'session') =>
  storage === 'local'
    ? localStorage.getItem('token')
    : sessionStorage.getItem('token');

export const getStoredUser = (storage = 'session') => {
  const raw = storage === 'local'
    ? localStorage.getItem('user')
    : sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};



export const clearAuthCookie = () => {
  document.cookie = 'rentsphere_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

// src/utils/api.js
import axios from 'axios';

// ---------------------------------------------------------------------------
// Base client — automatically attaches Authorization header from localStorage
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: '', // CRA proxy (package.json) forwards /api/* → http://localhost:8080
  headers: { 'Content-Type': 'application/json' },
});

// Multipart client — for file uploads (no Content-Type override, let browser set boundary)
const uploadClient = axios.create({
  baseURL: '',
});

// Attach token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Property API
// ---------------------------------------------------------------------------
export const propertyApi = {
  /** GET /api/properties — fetch all properties (optionally filtered by owner) */
  getAll: (params = {}) => apiClient.get('/api/properties', { params }),

  /** GET /api/properties/:id */
  getById: (id) => apiClient.get(`/api/properties/${id}`),

  /** POST /api/properties */
  create: (data) => apiClient.post('/api/properties', data),

  /** PUT /api/properties/:id */
  update: (id, data) => apiClient.put(`/api/properties/${id}`, data),

  /** DELETE /api/properties/:id */
  remove: (id) => apiClient.delete(`/api/properties/${id}`),
};

// ---------------------------------------------------------------------------
// Owner API — RS-14
// ---------------------------------------------------------------------------
export const ownerApi = {
  /**
   * GET /api/owners/dashboard
   * Returns: { totalProperties, pendingRequests, activeContracts }
   */
  getDashboardStats: () => apiClient.get('/api/owners/dashboard'),
};

// ---------------------------------------------------------------------------
// Upload API — RS-9
// POST /api/uploads  → accepts multipart/form-data
//                    → returns { urls: string[] } (Cloudinary URLs)
// ---------------------------------------------------------------------------
uploadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadApi = {
  /**
   * Upload one image file.
   * @param {File} file
   * @param {function} onProgress  - callback(percent: number)
   * @returns {Promise<string>}    - the Cloudinary URL
   */
  uploadOne: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadClient.post('/api/uploads', formData, {
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
  },
};

export default apiClient;

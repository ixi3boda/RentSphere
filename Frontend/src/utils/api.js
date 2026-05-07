// src/utils/api.js
//
// Central Axios client + per-domain service objects.
// The CRA proxy in package.json forwards /api/* → http://localhost:8080
// so baseURL stays empty for dev. Set REACT_APP_API_BASE_URL for production.
// ---------------------------------------------------------------------------
import axios from "axios";

const BASE = "";

// ---------------------------------------------------------------------------
// Base client — JSON, automatically attaches JWT from localStorage
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  // Check sessionStorage first (current session), then localStorage (stay signed in)
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Auth API  (/api/user/*)
// ---------------------------------------------------------------------------
export const authApi = {
  /**
   * POST /api/user/register
   * @param {{ email, password_hash, username, full_name, mobile_number, avatar_url }} payload
   * @returns {Promise<AxiosResponse<{ token: string }>>}
   */
  register: (payload) => apiClient.post("/api/user/register", payload),

  /**
   * POST /api/user/login
   * @param {{ email: string, password_hash: string }} payload
   * @returns {Promise<AxiosResponse<{ token: string }>>}
   */
  login: (payload) => apiClient.post("/api/user/login", payload),

  /**
   * PUT /api/user/me  — update current user profile
   */
  updateProfile: (payload) => apiClient.put("/api/user/me", payload),

  /**
   * POST /api/user/logout
   */
  logout: () => apiClient.post("/api/user/logout"),

  /**
   * GET /api/user/me  — requires JWT
   * @returns {Promise<AxiosResponse<User>>}
   */
  getMe: () => apiClient.get("/api/user/me"),
};

// ---------------------------------------------------------------------------
// Property API  (/api/properties/*)
// ---------------------------------------------------------------------------
export const propertyApi = {
  /** GET /api/properties/all — all properties (authenticated) */
  getAll: () => apiClient.get("/api/properties/all"),

  /** GET /api/properties/:id */
  getById: (id) => apiClient.get(`/api/properties/${id}`),

  /**
   * POST /api/properties/add  (ADMIN only)
   * @param {Object} data — CreatePropertyRequest body (includes coverPic)
   * Backend expects: { propertyType, title, propertyDescription, pricePerMonth,
   *   city, district, address, latitude, longitude, numRooms, areaSqm,
   *   isAvailable, coverPic }
   */
  create: (data) => apiClient.post("/api/properties/add", data),

  /**
   * PUT /api/properties/{id}/update  (ADMIN only)
   * All fields sent as JSON request body (all optional on the backend).
   * @param {number|string} id
   * @param {Object} body — UpdatePropertyRequest fields (camelCase)
   */
  update: (id, body) =>
    apiClient.put(`/api/properties/${id}/update`, body),

  /**
   * DELETE /api/properties/{id}/delete  (ADMIN only)
   */
  delete: (id) => apiClient.delete(`/api/properties/${id}/delete`),

  /**
   * GET /api/properties/filter
   * @param {{ city?, district?, minPrice?, maxPrice?, numRooms?, isAvailable? }} params
   */
  filter: (params = {}) => apiClient.get("/api/properties/filter", { params }),

  /**
   * GET /api/properties/search?prefix=...
   * @param {string} prefix
   */
  search: (prefix) =>
    apiClient.get("/api/properties/search", { params: { prefix } }),

  /**
   * POST /api/properties/{propertyId}/favorite  (authenticated tenant)
   * Marks property as favorite for the current tenant.
   */
  favorite: (propertyId) =>
    apiClient.post(`/api/properties/${propertyId}/favorite`),

  /**
   * GET /api/properties/favorites/all  (authenticated tenant)
   */
  getFavorites: () => apiClient.get("/api/properties/favorites/all"),

  /**
   * POST /api/properties/:id/images/add  (ADMIN only)
   * @param {number|string} id
   * @param {string} image_url
   * @param {boolean} is_cover
   */
  addImage: (id, image_url, is_cover = false) =>
    apiClient.post(`/api/properties/${id}/images/add`, null, {
      params: { image_url, is_cover },
    }),
};

// ---------------------------------------------------------------------------
// Rent API  (/api/rent/*)
// ---------------------------------------------------------------------------
export const rentApi = {
  /**
   * POST /api/rent/request  (authenticated tenant)
   * @param {{ propertyId, message, desiredStart, desiredMonths }} body — CreateRentalRequest
   */
  createRequest: (body) => apiClient.post("/api/rent/request", body),

  /** GET /api/rent/requests/all  (ADMIN) */
  getAllRequests: () => apiClient.get("/api/rent/requests/all"),

  /** GET /api/rent/requests/:id */
  getRequestById: (id) => apiClient.get(`/api/rent/requests/${id}`),

  /** GET /api/rent/contracts/all  (ADMIN) */
  getAllContracts: () => apiClient.get("/api/rent/contracts/all"),

  /**
   * PUT /api/rent/requests/:id/accept  (ADMIN only)
   */
  acceptRequest: (id) => apiClient.put(`/api/rent/requests/${id}/accept`),

  /**
   * PUT /api/rent/requests/:id/reject  (ADMIN only)
   */
  rejectRequest: (id) => apiClient.put(`/api/rent/requests/${id}/reject`),

  /**
   * POST /api/rent/contracts/:contractId/paypal
   * @param {number} contractId
   * @param {{ amount, currency, description, cancelUrl, successUrl }} body — PayPalPaymentRequest
   */
  createPayPalPayment: (contractId, body) =>
    apiClient.post(`/api/rent/contracts/${contractId}/paypal`, body),

  /**
   * POST /api/rent/contracts/:contractId/paypal/execute?paymentId=...&payerId=...
   * @param {number} contractId
   * @param {string} paymentId
   * @param {string} payerId
   */
  executePayPalPayment: (contractId, paymentId, payerId) =>
    apiClient.post(`/api/rent/contracts/${contractId}/paypal/execute`, null, {
      params: { paymentId, payerId },
    }),
};

// ---------------------------------------------------------------------------
// Upload API (Stub)
// ---------------------------------------------------------------------------
export const uploadApi = {
  uploadOne: (file, onProgress) => {
    // Stub for now. ImageUpload uses MOCK_MODE = true anyway.
    return Promise.resolve({ data: { url: URL.createObjectURL(file) } });
  },
};

export default apiClient;

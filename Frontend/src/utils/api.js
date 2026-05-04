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
  const token = localStorage.getItem("token");
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
   * @param {Property} data  — backend Property DTO shape
   * @param {string|null} coverPic — optional cover image URL query param
   */
  create: (data, coverPic = null) => {
    const params = coverPic ? { coverPic } : {};
    return apiClient.post("/api/properties/add", data, { params });
  },

  /**
   * PUT /api/properties/update/:id  (ADMIN only)
   * All fields sent as query params (all optional on the backend).
   * @param {number|string} id
   * @param {Object} params — subset of property fields to update
   */
  update: (id, params) =>
    apiClient.put(`/api/properties/update/${id}`, null, { params }),

  /**
   * DELETE /api/properties/delete/:id  (ADMIN only)
   */
  delete: (id) => apiClient.delete(`/api/properties/delete/${id}`),

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
   * POST /api/properties/favorite?property_id=...  (authenticated tenant)
   * Toggles favorite on/off and returns updated state.
   */
  favorite: (property_id) =>
    apiClient.post("/api/properties/favorite", null, {
      params: { property_id },
    }),

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
// Upload API (Stub)
// ---------------------------------------------------------------------------
export const uploadApi = {
  uploadOne: (file, onProgress) => {
    // Stub for now. ImageUpload uses MOCK_MODE = true anyway.
    return Promise.resolve({ data: { url: URL.createObjectURL(file) } });
  },
};

export default apiClient;

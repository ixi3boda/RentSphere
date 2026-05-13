





import axios from "axios";

const BASE = "";




const apiClient = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});




export const authApi = {
  
  register: (payload) => apiClient.post("/api/user/register", payload),

  
  login: (payload) => apiClient.post("/api/user/login", payload),

  
  updateProfile: (payload) => apiClient.put("/api/user/me", payload),

  
  logout: () => apiClient.post("/api/user/logout"),

  
  getMe: () => apiClient.get("/api/user/me"),
};




export const propertyApi = {
  
  getAll: () => apiClient.get("/api/properties/all"),

  
  getById: (id) => apiClient.get(`/api/properties/${id}`),

  
  create: (data) => apiClient.post("/api/properties/add", data),

  
  update: (id, body) =>
    apiClient.put(`/api/properties/${id}/update`, body),

  
  delete: (id) => apiClient.delete(`/api/properties/${id}/delete`),

  
  filter: (params = {}) => apiClient.get("/api/properties/filter", { params }),

  
  search: (prefix) =>
    apiClient.get("/api/properties/search", { params: { prefix } }),

  
  favorite: (propertyId) =>
    apiClient.post(`/api/properties/${propertyId}/favorite`),

  
  getFavorites: () => apiClient.get("/api/properties/favorites/all"),

  
  addImage: (id, image_url, is_cover = false) =>
    apiClient.post(`/api/properties/${id}/images/add`, null, {
      params: { image_url, is_cover },
    }),
};




export const rentApi = {
  
  createRequest: (body) => apiClient.post("/api/rent/request", body),

  
  getAllRequests: () => apiClient.get("/api/rent/requests/all"),

  
  getRequestById: (id) => apiClient.get(`/api/rent/requests/${id}`),

  
  getAllContracts: () => apiClient.get("/api/rent/contracts/all"),
  getContractPayments: (contractId) => apiClient.get(`/api/rent/contracts/${contractId}/payments`),

  
  acceptRequest: (id) => apiClient.put(`/api/rent/requests/${id}/accept`),

  
  rejectRequest: (id) => apiClient.put(`/api/rent/requests/${id}/reject`),

  
  createPayPalPayment: (contractId, body) =>
    apiClient.post(`/api/rent/contracts/${contractId}/paypal`, body),

  
  executePayPalPayment: (contractId, paymentId, payerId) =>
    apiClient.post(`/api/rent/contracts/${contractId}/paypal/execute`, null, {
      params: { paymentId, payerId },
    }),
};




export const uploadApi = {
  uploadOne: (file, onProgress) => {
    
    return Promise.resolve({ data: { url: URL.createObjectURL(file) } });
  },
};

export default apiClient;

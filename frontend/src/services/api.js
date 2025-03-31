import axios from 'axios';

// Create an Axios instance with a base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g., "https://api.example.com"
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the JWT token (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Consider secure storage for production!
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error info (can be enhanced with a logging service)
    if (error.response) {
      console.error('API Error Response:', error.response);
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

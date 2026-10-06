import axios from "axios";

// Base API URL from environment variable or localhost fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Attach JWT Token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token =
        localStorage.getItem("token") ||
        (localStorage.getItem("userInfo")
          ? JSON.parse(localStorage.getItem("userInfo")).token
          : null);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // If uploading FormData, let browser/Axios set multipart/form-data boundary
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }
    } catch (e) {
      console.error("Error retrieving auth token for request:", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Response Interceptor: Global 401/403 Handling & Standard Error Extraction
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if unauthorized
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Clear expired/invalid auth state
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        window.dispatchEvent(new Event("auth:unauthorized"));
      }

      // Ensure error message is easily readable
      if (error.response.data && error.response.data.message) {
        error.message = error.response.data.message;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

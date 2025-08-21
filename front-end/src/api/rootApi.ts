import axios from "axios";
import Cookies from "js-cookie";

export const userAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Essential for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

userAPI.interceptors.request.use(
  (config) => {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const userAPINoAuth = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

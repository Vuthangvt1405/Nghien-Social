import axios from "axios";

export const userAPI = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Essential for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export const userAPINoAuth = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

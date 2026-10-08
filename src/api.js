import axios from "axios";
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && sessionStorage.getItem("token")) {
      sessionStorage.clear();
      window.location = "/login";
    }
    return Promise.reject(error);
  },
);
export const message = (error) =>
  error.response?.data?.message ||
  error.response?.data ||
  "Unable to complete the request";
export default api;

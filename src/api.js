import axios from "axios";

const productionApiUrl = "https://anti-impulse-backend.onrender.com/api";
const apiBaseUrl =
  process.env.NODE_ENV === "production"
    ? productionApiUrl
    : process.env.REACT_APP_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: apiBaseUrl,
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

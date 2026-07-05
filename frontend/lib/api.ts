import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

// Empty baseURL → requests go to same origin (localhost:3000)
// Next.js rewrites /api/* → http://localhost:8000/api/* server-side (no CORS)
export const api: AxiosInstance = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Inject access token from memory on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("helixa_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh on 401
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post<{ access_token: string }>("/api/auth/refresh")
            .then((r) => {
              const token = r.data.access_token;
              sessionStorage.setItem("helixa_token", token);
              refreshPromise = null;
              return token;
            })
            .catch(() => {
              refreshPromise = null;
              sessionStorage.removeItem("helixa_token");
              window.location.href = "/login";
              return null;
            });
        }
        const token = await refreshPromise;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        sessionStorage.removeItem("helixa_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

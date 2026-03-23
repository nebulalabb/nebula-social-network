import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Sync localStorage token → cookie khi app load (để middleware đọc được)
if (typeof window !== "undefined") {
  const token = localStorage.getItem("accessToken");
  if (token) {
    document.cookie = `accessToken=${token}; path=/; max-age=${14 * 60}; SameSite=Strict`;
  }
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.accessToken;
        localStorage.setItem("accessToken", newToken);
        document.cookie = `accessToken=${newToken}; path=/; max-age=${14 * 60}`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        document.cookie = "accessToken=; path=/; max-age=0";
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

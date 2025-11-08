import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // important! sends cookies (refresh token)
});

// Add access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  console.log("➡️ Requesting:", config.url, "with token:", token ? "✅ set" : "❌ missing");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});




// Handle expired access token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔁 Access token expired — attempting refresh...");

        const res = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken; // ✅ fix spelling

        if (newAccessToken) {
          // Save new token
          localStorage.setItem("accessToken", newAccessToken);
          console.log("✅ Token refreshed successfully");

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError.message);
        localStorage.removeItem("accessToken");
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);


export default api;

"use client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api.js"; // axios instance or fetch wrapper

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Restore user on reload
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
  
    setLoading(false);
  }, []);

  // ✅ Login handler
  const login = (data) => {
    localStorage.setItem("accessToken", data.accessToken);
  };

  // ✅ Logout handler
  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err.message);
    } finally {
      localStorage.removeItem("accessToken");
      document.cookie = "refreshToken=; Max-Age=0; path=/;";
      router.push("/auth/login");
    }
  };

  // ✅ Refresh token logic
  const refreshAccessToken = async () => {
    try {
      const res = await api.post("/auth/refresh", {}, { withCredentials: true });
      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        return res.data.accessToken;
      }
    } catch (err) {
      console.error("Refresh token failed:", err.message);
      logout();
    }
  };

  // ✅ Authenticated fetch wrapper (auto refresh + retry)
  const authFetch = async (url, options = {}) => {
    let token = localStorage.getItem("accessToken");

    let res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (res.status === 401) {
      // Token expired — try refreshing
      const newToken = await refreshAccessToken();
      if (newToken) {
        res = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
          credentials: "include",
        });
      }
    }

    return res;
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, authFetch, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

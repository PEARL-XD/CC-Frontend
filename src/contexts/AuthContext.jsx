import React, { createContext, useState, useEffect, useCallback, useRef } from "react";

export const AuthContext = createContext();

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRefreshing = useRef(false); // Ref to lock refresh calls

  const fetchUserProfile = useCallback(async () => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user profile");
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
    }
  }, [accessToken]);

  const fetchAccessToken = useCallback(async () => {
    if (isRefreshing.current) return false; // Prevent concurrent refreshes
    isRefreshing.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
        method: "POST",
        credentials: "include", // send httpOnly cookie
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        await fetchUserProfile();
        return true;
      } else if (response.status === 401) {
        console.info("User not authenticated (no refresh token).");
        setAccessToken(null);
        setUser(null);
        return false;
      } else {
        console.error("Failed to refresh access token:", response.statusText);
        setAccessToken(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Network error during access token refresh:", error);
      setAccessToken(null);
      setUser(null);
      return false;
    } finally {
      isRefreshing.current = false;
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    fetchAccessToken();
  }, [fetchAccessToken]);

  useEffect(() => {
    // Fetch user profile if accessToken changes (e.g., manual login)
    if (accessToken) {
      fetchUserProfile();
    } else {
      setUser(null);
    }
  }, [accessToken, fetchUserProfile]);

  // Refresh access token proactively every REFRESH_INTERVAL ms
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      fetchAccessToken().then((success) => {
        if (!success) clearInterval(interval);
      });
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [accessToken, fetchAccessToken]);

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

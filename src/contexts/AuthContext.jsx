import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

export const AuthContext = createContext();

const REFRESH_INTERVAL = 15 * 60 * 1000;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isRefreshing = useRef(false);
  const refreshIntervalRef = useRef(null);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const fetchUserProfile = useCallback(
    async (tokenOverride) => {
      const token = tokenOverride ?? accessToken;

      if (!token) {
        setUser(null);
        return false;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          return true;
        }

        if (response.status === 401 || response.status === 403) {
          clearAuth();
          return false;
        }

        console.error("Failed to fetch user profile:", response.statusText);
        return false;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return false;
      }
    },
    [accessToken, clearAuth]
  );

  const fetchAccessToken = useCallback(async () => {
    if (isRefreshing.current) return false;
    isRefreshing.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/refresh-token`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.accessToken;

        if (!newToken) {
          clearAuth();
          return false;
        }

        setAccessToken(newToken);
        await fetchUserProfile(newToken);
        return true;
      }

      if (response.status === 401 || response.status === 403) {
        clearAuth();
        return false;
      }

      console.error("Failed to refresh access token:", response.statusText);
      clearAuth();
      return false;
    } catch (error) {
      console.error("Network error during access token refresh:", error);
      clearAuth();
      return false;
    } finally {
      isRefreshing.current = false;
      setLoading(false);
    }
  }, [clearAuth, fetchUserProfile]);

  useEffect(() => {
    fetchAccessToken();
  }, [fetchAccessToken]);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }

    fetchUserProfile();
  }, [accessToken, fetchUserProfile]);

  useEffect(() => {
    if (!accessToken) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      fetchAccessToken().then((success) => {
        if (!success && refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      });
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [accessToken, fetchAccessToken]);

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout network errors
    }

    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        user,
        setUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

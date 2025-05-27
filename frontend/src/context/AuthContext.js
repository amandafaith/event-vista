import React, { createContext, useState, useContext, useEffect } from "react";
import { authApi } from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (initialized) return;

      console.log("Starting authentication check...");
      try {
        const response = await authApi.getCurrentUser();
        console.log("Auth check response status:", response.status);
        console.log("Auth check response data:", response.data);

        if (mounted) {
          if (response.data && response.data.id) {
            console.log("Valid user data found, setting user");
            setUser(response.data);
          } else {
            console.log("No valid user data, setting user to null");
            setUser(null);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.log("Auth check error:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [initialized]);

  const login = async (credentials) => {
    console.log("Login attempt with credentials:", credentials.emailAddress);
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      console.log("Login response:", response);
      if (response.data && response.data.user) {
        console.log("Login successful, setting user");
        setUser(response.data.user);
        setLoading(false);
        return true;
      } else {
        console.log("Invalid login response format");
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      if (formData.password !== formData.verifyPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await authApi.register(formData);
      // Store verification state in localStorage
      localStorage.setItem("verificationPending", "true");
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("Logout attempt");
    setLoading(true);
    try {
      await authApi.logout();
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      console.log("Setting user to null after logout");
      setUser(null);
      setLoading(false);
      setInitialized(false);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  console.log("AuthContext state:", {
    user,
    loading,
    isAuthenticated: !!user,
    initialized,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

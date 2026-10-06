import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userInfo");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore auth from localStorage", e);
    } finally {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      toast.warn("Session expired. Please sign in again.", { toastId: "session-expired" });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const response = await API.post("/auth/login", { email, password });
    const rawData = response.data;
    const userData = rawData.data || rawData;

    localStorage.setItem("token", userData.token);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
    setShowAuthModal(false);
    return userData;
  };

  const register = async (name, email, password, role = "customer", referralCode = null) => {
    const payload = { name, email, password, role };
    if (referralCode && typeof referralCode === "string" && referralCode.trim()) {
      payload.referralCode = referralCode.trim();
    }

    const response = await API.post("/auth/register", payload);
    const rawData = response.data;
    const userData = rawData.data || rawData;

    localStorage.setItem("token", userData.token);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
    setShowAuthModal(false);
    return userData;
  };

  const refreshUser = async () => {
    try {
      const response = await API.get("/referrals/my-referral-info");
      if (response.data?.data) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            walletBalance: response.data.data.walletBalance,
            referralCode: response.data.data.referralCode,
          };
          localStorage.setItem("userInfo", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      // Non-blocking background sync
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setUser(null);
    toast.info("You have signed out.");
  };

  const openAuthModal = (mode = "login") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        refreshUser,
        logout,
        showAuthModal,
        authMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

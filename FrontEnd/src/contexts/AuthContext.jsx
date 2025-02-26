import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [processingAuth, setProcessingAuth] = useState(false);
  const navigate = useNavigate();

  // 配置
  const cognitoConfig = {
    clientId: "4r2ui82gb5gigfrfjl18tq1i6i",
    authority:
      "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_BXhdoWuDl",
    redirectUri: window.location.origin + "/authorize",
    scope: "email openid phone",
  };

  useEffect(() => {
    // 检查本地存储的令牌
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token) {
      setAccessToken(token);
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      } else {
        // 有令牌但没有用户数据，尝试获取用户信息
        fetchUserInfo(token);
      }
    }

    setLoading(false);
  }, []);

  // 从Cognito获取用户信息
  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(
        "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_BXhdoWuDl/userInfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = response.data;
      setCurrentUser(userData);
      localStorage.setItem("user_data", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to fetch user information", error);
      logout();
    }
  };

  // Login function - directly use Cognito URL
  const login = () => {
    const redirectUri = "http://localhost:5173/authorize";

    const authorizationUrl =
      `https://ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com/login?` +
      `client_id=4r2ui82gb5gigfrfjl18tq1i6i&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log("Redirecting to:", authorizationUrl);
    window.location.href = authorizationUrl;
  };

  // Handle OAuth callback
  const handleAuthCallback = async (code) => {
    if (processingAuth) {
      console.log("Auth process already in progress");
      return false;
    }

    try {
      setProcessingAuth(true);
      setLoading(true);

      const processedCode = sessionStorage.getItem("processed_auth_code");
      if (processedCode === code) {
        console.log("Auth code already processed");
        return false;
      }

      const response = await axios.post(
        "http://localhost:5001/api/auth/token",
        { code },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.access_token) {
        setCurrentUser(response.data.user);
        setAccessToken(response.data.access_token);
        sessionStorage.setItem("processed_auth_code", code);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token exchange error:", error);
      return false;
    } finally {
      setProcessingAuth(false);
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setCurrentUser(null);
    setAccessToken(null);

    // 重定向到Cognito登出端点
    const logoutUrl =
      `${cognitoConfig.authority}/logout?` +
      `client_id=${cognitoConfig.clientId}&` +
      `logout_uri=${encodeURIComponent(window.location.origin)}`;

    window.location.href = logoutUrl;
  };

  // 添加请求拦截器
  axios.interceptors.request.use(
    (config) => {
      // 防止重复请求
      const controller = new AbortController();
      config.signal = controller.signal;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const value = {
    currentUser,
    accessToken,
    loading,
    login,
    logout,
    handleAuthCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

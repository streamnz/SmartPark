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
    // 使用全局变量存储正在处理的代码
    const PROCESSING_KEY = "auth_code_processing";

    // 检查是否已经处理过该代码
    const processedCode = localStorage.getItem("processed_auth_code");
    if (processedCode === code) {
      console.log("此授权码已处理过，跳过");
      return true; // 返回 true 避免导航问题
    }

    // 检查是否有正在处理的请求
    if (localStorage.getItem(PROCESSING_KEY) === code) {
      console.log("此授权码正在处理中，跳过");
      return false;
    }

    try {
      // 标记为正在处理
      localStorage.setItem(PROCESSING_KEY, code);
      setProcessingAuth(true);
      setLoading(true);

      console.log("开始处理新授权码:", code);

      const response = await axios.post(
        "http://localhost:5001/api/auth/token",
        { code },
        {
          headers: { "Content-Type": "application/json" },
          // 添加防止重复请求的标识
          signal: AbortSignal.timeout(10000), // 10秒超时
        }
      );

      if (response.data.access_token) {
        setCurrentUser(response.data.user);
        setAccessToken(response.data.access_token);
        // 保存已处理的代码
        localStorage.setItem("processed_auth_code", code);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token交换错误:", error);
      return false;
    } finally {
      // 清除处理状态
      localStorage.removeItem(PROCESSING_KEY);
      setProcessingAuth(false);
      setLoading(false);
    }
  };

  // Logout function - directly use Cognito logout URL
  const logout = () => {
    // 清除所有状态和存储
    setCurrentUser(null);
    setAccessToken(null);
    setProcessingAuth(false);

    // 清除所有存储
    localStorage.clear();
    sessionStorage.clear(); // 添加这行，清除 session storage

    // 构建登出 URL
    const logoutUrl =
      `https://ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com/logout?` +
      `client_id=4r2ui82gb5gigfrfjl18tq1i6i&` +
      `logout_uri=${encodeURIComponent("http://localhost:5173")}&` +
      `response_type=token`; // 添加响应类型

    // 重定向到登出页面
    window.location.replace(logoutUrl); // 使用 replace 而不是 href
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

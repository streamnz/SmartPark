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

  // 获取当前域名，用于动态设置回调URL
  const getCurrentDomain = () => {
    return window.location.origin;
  };

  // 获取API基础URL
  const getApiBaseUrl = () => {
    const domain = getCurrentDomain();
    if (domain.includes("localhost")) {
      return "http://localhost:5001";
    } else if (domain.includes("streamnz.com")) {
      // 修改为正确的 API 域名
      return "https://smartparking-api.streamnz.com";
    } else {
      // 默认情况
      return "http://localhost:5001";
    }
  };

  // 配置
  const cognitoConfig = {
    clientId: "4r2ui82gb5gigfrfjl18tq1i6i",
    authority:
      "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_BXhdoWuDl",
    redirectUri: `${getCurrentDomain()}/authorize`,
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
    // 清除旧的授权状态
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("processed_auth_code");

    const redirectUri = `${getCurrentDomain()}/authorize`;

    // 使用正确的 Cognito 域名
    const authorizationUrl =
      `https://ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com/login?` +
      `client_id=${cognitoConfig.clientId}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(cognitoConfig.scope)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log("重定向到登录页:", authorizationUrl);
    window.location.href = authorizationUrl;
  };

  // Handle OAuth callback
  const handleAuthCallback = async (code) => {
    try {
      setProcessingAuth(true);
      setLoading(true);

      console.log("开始处理授权码:", code);

      // 获取API基础URL
      const apiBaseUrl = getApiBaseUrl();
      const tokenEndpoint = `${apiBaseUrl}/api/auth/token`;

      const response = await axios.post(
        tokenEndpoint,
        {
          code,
          redirect_uri: `${getCurrentDomain()}/authorize`,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.access_token) {
        // 保存令牌和用户信息到本地存储
        localStorage.setItem("auth_token", response.data.access_token);
        if (response.data.user) {
          localStorage.setItem("user_data", JSON.stringify(response.data.user));
        }

        // 更新状态
        setCurrentUser(response.data.user);
        setAccessToken(response.data.access_token);

        // 记录处理成功的授权码
        localStorage.setItem("processed_auth_code", code);

        return true;
      }

      console.error(
        "Token exchange response missing access_token:",
        response.data
      );
      return false;
    } catch (error) {
      console.error("Token交换错误:", error);
      // 清除可能存在的无效数据
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("processed_auth_code");
      return false;
    } finally {
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

    // 根据当前域名动态设置登出重定向URI
    const logoutRedirectUri = getCurrentDomain();

    // 构建登出 URL
    const logoutUrl =
      `https://ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com/logout?` +
      `client_id=4r2ui82gb5gigfrfjl18tq1i6i&` +
      `logout_uri=${encodeURIComponent(logoutRedirectUri)}&` +
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

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function AuthCallback() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { handleAuthCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const processCallback = useCallback(async () => {
    // 检查是否有错误参数
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get("error");

    if (errorParam) {
      console.error("认证错误:", errorParam);
      setError(errorParam);
      navigate("/login");
      return;
    }

    const code = urlParams.get("code");
    if (!code) {
      setError("未找到授权码");
      return;
    }

    // 使用 localStorage 来防止重复处理
    // 注意：使用 localStorage 而不是 sessionStorage，确保与 AuthContext 一致
    const processedCode = localStorage.getItem("processed_auth_code");
    if (processedCode === code) {
      console.log("此授权码已处理过，直接进入仪表板");
      navigate("/dashboard");
      return;
    }

    try {
      setLoading(true);
      console.log("处理新授权码...");
      const success = await handleAuthCallback(code);

      if (success) {
        navigate("/dashboard");
      } else {
        setError("认证失败");
      }
    } catch (err) {
      console.error("错误:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location.search, handleAuthCallback, navigate]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return (
    <div className="auth-callback-container">
      {loading ? (
        <div className="loading">
          <p>Processing authentication...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => navigate("/login")}>Return to Login</button>
        </div>
      ) : null}
    </div>
  );
}

export default AuthCallback;

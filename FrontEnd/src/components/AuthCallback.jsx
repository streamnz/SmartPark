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
    const error = urlParams.get("error");

    if (error) {
      console.error("认证错误:", error);
      setError(error);
      navigate("/login");
      return;
    }

    // 使用 sessionStorage 来防止重复处理
    const processedUrl = sessionStorage.getItem("processed_callback_url");
    if (processedUrl === location.search) {
      console.log("Callback already processed");
      navigate("/dashboard");
      return;
    }

    try {
      setLoading(true);
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");

      if (!code) {
        setError("Authorization code not found");
        return;
      }

      console.log("Processing new authorization code...");
      const success = await handleAuthCallback(code);

      if (success) {
        // 存储已处理的URL
        sessionStorage.setItem("processed_callback_url", location.search);
        navigate("/dashboard");
      } else {
        setError("Authentication failed");
      }
    } catch (err) {
      console.error("Error:", err);
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

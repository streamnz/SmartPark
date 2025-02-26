import React from "react";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <h2>Login to Smart Parking System</h2>
      <p>Click the button below to login with AWS Cognito</p>
      <button onClick={login} className="login-button">
        Login
      </button>
    </div>
  );
}

export default Login;

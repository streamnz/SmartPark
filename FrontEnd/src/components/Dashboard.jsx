import React from "react";
import { useAuth } from "../contexts/AuthContext";

function Dashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="user-info">
        <h2>Welcome, {currentUser?.email || "User"}</h2>
        <p>You have successfully logged in!</p>
      </div>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default Dashboard;

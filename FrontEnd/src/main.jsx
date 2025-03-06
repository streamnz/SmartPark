import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "./index.css";
import App from "./App";
import { validateEnv, logAvailableEnv } from "./utils/env.js";

// 移除 Amplify 导入和配置
// import { Amplify } from "aws-amplify";
// Amplify.configure({...});

// 创建深色主题
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2196f3",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#1a1a1a",
      paper: "#2d2d2d",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// 在开发环境下记录环境变量
if (import.meta.env.DEV) {
  console.log("🚀 Starting application in development mode");
  console.log("📦 Checking environment variables...");
  logAvailableEnv();

  // 验证环境变量
  const valid = validateEnv();
  if (!valid) {
    console.warn(
      "⚠️ Some environment variables are missing. Application may not function correctly."
    );
  } else {
    console.log("✅ Environment variables validated successfully");
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);

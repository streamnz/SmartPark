import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/Login";
import AuthCallback from "./components/AuthCallback";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import TestPage from "./pages/TestPage";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4fc3f7",
    },
    secondary: {
      main: "#f48fb1",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  // 添加useEffect来移动地图图例
  useEffect(() => {
    // 这个函数将尝试寻找并移动Map Legend元素
    const moveMapLegend = () => {
      // 尝试通过文本内容查找Map Legend元素
      const mapLegendElements = Array.from(
        document.querySelectorAll("span")
      ).filter((el) => el.textContent === "Map Legend");

      if (mapLegendElements.length > 0) {
        // 找到包含Map Legend的父容器
        let container = mapLegendElements[0];
        // 向上查找到Box容器(通常是position: absolute的元素)
        while (
          container &&
          (!container.style || container.style.position !== "absolute")
        ) {
          container = container.parentElement;
          if (!container) break;
        }

        // 如果找到了容器，修改其位置
        if (container) {
          container.style.right = "auto";
          container.style.left = "16px";
          console.log("Map Legend has been moved to left bottom corner");
        }
      }
    };

    // 执行移动操作
    moveMapLegend();

    // 为了确保在地图加载后执行，设置一个延时
    const timerId = setTimeout(moveMapLegend, 2000);

    // 清理函数
    return () => clearTimeout(timerId);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/authorize" element={<AuthCallback />} />
            <Route path="/authorize/" element={<AuthCallback />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/test" element={<TestPage />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

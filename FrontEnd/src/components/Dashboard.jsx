// FrontEnd/src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  CircularProgress,
  Button,
  Alert,
  Box,
  Typography,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Container,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DestinationSelector from "./DestinationSelector";
import { api } from "../services/api";

function Dashboard() {
  const { currentUser, accessToken, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState(null);

  useEffect(() => {
    async function verifyAuth() {
      try {
        if (currentUser && accessToken) {
          console.log("用户已认证:", currentUser);
          setAuthenticated(true);
          setLoading(false);
        } else {
          console.error("缺少用户信息或访问令牌");
          setError("认证信息不完整");
          setLoading(false);
        }
      } catch (err) {
        console.error("验证用户时出错:", err);
        setError("验证用户时出错");
        setLoading(false);
      }
    }

    verifyAuth();
  }, [currentUser, accessToken]);

  const handleSelectDestination = (destination) => {
    setSelectedDestination(destination);

    // 如果目的地包含停车信息，直接跳到最后一步
    if (destination.parking) {
      setActiveStep(2);
    } else {
      setActiveStep(1);
    }
  };

  const confirmDestination = () => {
    setActiveStep(2);
  };

  const resetNavigation = () => {
    setSelectedDestination(null);
    setActiveStep(0);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          加载中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => (window.location.href = "/login")}
          sx={{ mt: 2 }}
        >
          需要重新登录
        </Button>
      </Box>
    );
  }

  const steps = ["选择目的地", "确认详情", "导航至停车位"];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* 应用栏 */}
      <AppBar position="static">
        <Toolbar>
          {activeStep > 0 && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={resetNavigation}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            智能停车系统
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {currentUser?.email || "用户"}
            </Typography>
            <IconButton
              color="inherit"
              onClick={logout}
              size="small"
              sx={{ ml: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            p: 1,
            px: 4,
          }}
        >
          <Stepper
            activeStep={activeStep}
            sx={{
              "& .MuiStepLabel-label": {
                color: "white",
              },
              "& .MuiStepIcon-root.Mui-active": {
                color: "#4fc3f7",
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </AppBar>

      {/* 主内容区 */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {activeStep === 0 && (
          <DestinationSelector onSelectDestination={handleSelectDestination} />
        )}

        {activeStep === 1 && selectedDestination && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                确认您的目的地
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  mb: 3,
                }}
              >
                <Box sx={{ flex: 1, mr: { md: 2 } }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedDestination.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {selectedDestination.address}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    类别: {selectedDestination.category}
                  </Typography>
                  <Typography variant="body2">
                    可用停车位: {selectedDestination.availableSpots} 个
                  </Typography>
                </Box>

                <Box
                  sx={{
                    minWidth: { xs: "100%", md: "300px" },
                    height: "200px",
                    mt: { xs: 2, md: 0 },
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DirectionsCarIcon
                    sx={{ fontSize: 80, color: "rgba(0,0,0,0.2)" }}
                  />
                </Box>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={confirmDestination}
              >
                确认并继续
              </Button>
            </Paper>
          </Box>
        )}

        {activeStep === 2 && selectedDestination && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                已选择停车位
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {selectedDestination.parking ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedDestination.parking.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {selectedDestination.parking.distance} •{" "}
                    {selectedDestination.parking.price}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    可用空位: {selectedDestination.parking.availableSpots} 个
                  </Typography>
                  <Typography variant="body2">
                    设施:{" "}
                    {selectedDestination.parking.isCovered
                      ? "室内停车场"
                      : "室外停车场"}
                    ,{selectedDestination.parking.security}
                  </Typography>

                  <Alert severity="success" sx={{ mt: 2 }}>
                    您的停车位已预留。请在1小时内到达。
                  </Alert>
                </Box>
              ) : (
                <Typography>
                  未选择具体停车位，将为您导航至目的地附近。到达后系统将推荐最佳停车选择。
                </Typography>
              )}

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
                onClick={resetNavigation}
              >
                完成
              </Button>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;

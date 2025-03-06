// FrontEnd/src/components/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
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
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import PlaceIcon from "@mui/icons-material/Place";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DestinationSelector from "./DestinationSelector";
import { api } from "../services/api";

function Dashboard() {
  const { currentUser, accessToken, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinations, setDestinations] = useState({ data: [] });
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [isParked, setIsParked] = useState(false);
  const navigationTimer = useRef(null);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        if (currentUser && accessToken) {
          setAuthenticated(true);

          const destinationsData = await api.getDestinations();
          setDestinations(destinationsData);

          const vehiclesData = await api.getVehicles();
          if (vehiclesData && vehiclesData.data) {
            setVehicles(vehiclesData.data);
            setSelectedVehicle(vehiclesData.data[0]);
          }
        } else {
          setError("认证信息不完整");
        }
      } catch (err) {
        console.error("加载初始数据时出错:", err);
        setError("获取数据时出错");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [currentUser, accessToken]);

  const handleSelectDestination = (destination) => {
    setSelectedDestination(destination);
    setActiveStep(1);
  };

  const confirmDestination = () => {
    setActiveStep(2);
    if (navigationTimer.current) {
      clearInterval(navigationTimer.current);
    }

    setNavigationProgress(0);
    navigationTimer.current = setInterval(() => {
      setNavigationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(navigationTimer.current);
          return 100;
        }
        return prev + 1;
      });
    }, 300);
  };

  const handleArriveParking = (parkingLot) => {
    setActiveStep(3);
    api
      .getParkingLotDetails(parkingLot.id)
      .then((details) => {
        setParkingSpots(details);
      })
      .catch((err) => {
        console.error("获取停车场详情出错:", err);
        setParkingSpots({
          recommended_spot: {
            id: "A12",
            type: "standard",
          },
          spots: {
            A12: {
              id: "A12",
              row: 0,
              col: 11,
              type: "standard",
              is_occupied: false,
            },
          },
        });
      });
  };

  const completeParking = () => {
    setIsParked(true);
    setActiveStep(4);
  };

  const resetNavigation = () => {
    if (navigationTimer.current) {
      clearInterval(navigationTimer.current);
    }
    setSelectedDestination(null);
    setParkingSpots([]);
    setNavigationProgress(0);
    setIsParked(false);
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

  const steps = [
    "选择目的地",
    "确认路线",
    "前往停车场",
    "找到停车位",
    "完成停车",
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "#121212",
      }}
    >
      <AppBar position="static" sx={{ bgcolor: "#1a1a1a" }}>
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

      <Box
        sx={{ flex: 1, overflow: "auto", bgcolor: "#121212", color: "white" }}
      >
        {activeStep === 0 && (
          <DestinationSelector
            destinations={destinations}
            onSelectDestination={handleSelectDestination}
          />
        )}

        {activeStep === 1 && selectedDestination && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Typography variant="h5" gutterBottom>
                确认您的目的地
              </Typography>
              <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />

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
                  <Typography variant="body2" sx={{ mt: 1, color: "#bbbbbb" }}>
                    类别: {selectedDestination.category}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    选择您的车辆:
                  </Typography>
                  <Grid container spacing={1}>
                    {vehicles.map((vehicle) => (
                      <Grid item xs={6} key={vehicle.id}>
                        <Card
                          sx={{
                            bgcolor:
                              selectedVehicle?.id === vehicle.id
                                ? "primary.dark"
                                : "#333333",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#444444" },
                          }}
                          onClick={() => setSelectedVehicle(vehicle)}
                        >
                          <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <DirectionsCarIcon sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {vehicle.name}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box
                  sx={{
                    minWidth: { xs: "100%", md: "300px" },
                    height: "200px",
                    mt: { xs: 2, md: 0 },
                    backgroundColor: "#2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: `url(/maps/destinations/${
                      selectedDestination.id || "default"
                    }.jpg)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: 1,
                  }}
                >
                  {!selectedDestination.image && (
                    <PlaceIcon
                      sx={{ fontSize: 80, color: "rgba(255,255,255,0.2)" }}
                    />
                  )}
                </Box>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={confirmDestination}
                disabled={!selectedVehicle}
              >
                确认并开始导航
              </Button>
            </Paper>
          </Box>
        )}

        {activeStep === 2 && selectedDestination && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Typography variant="h5" gutterBottom>
                前往: {selectedDestination.name}
              </Typography>
              <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />

              <Box
                sx={{
                  height: "300px",
                  bgcolor: "#333333",
                  mb: 2,
                  borderRadius: 1,
                  position: "relative",
                  backgroundImage: `url(/maps/auckland_map.jpg)`,
                  backgroundSize: "cover",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: "30%",
                    top: "60%",
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    border: "3px solid white",
                    boxShadow: 3,
                    zIndex: 2,
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    left: `${
                      50 + (selectedDestination.location.lng - 174.763) * 1000
                    }%`,
                    top: `${
                      50 + (selectedDestination.location.lat - -36.848) * 1000
                    }%`,
                    transform: "translate(-50%, -50%)",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "secondary.main",
                    border: "3px solid white",
                    boxShadow: 3,
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" color="white" fontWeight="bold">
                    D
                  </Typography>
                </Box>

                <Box
                  sx={{
                    position: "absolute",
                    left: "30%",
                    top: "60%",
                    width: "40%",
                    height: "2px",
                    bgcolor: "primary.main",
                    transformOrigin: "left center",
                    transform: `scaleX(${navigationProgress / 100})`,
                    zIndex: 1,
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    left: `calc(30% + ${(navigationProgress / 100) * 40}%)`,
                    top: "60%",
                    transform: "translate(-50%, -50%)",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "#ffffff",
                    border: "2px solid",
                    borderColor: "primary.main",
                    boxShadow: 2,
                    zIndex: 3,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    transition: "left 0.5s ease",
                  }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    🚗
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">导航信息</Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  从: 奥克兰市中心
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  到: {selectedDestination.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  距离: {Math.floor(Math.random() * 5) + 2} 公里
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  预计时间: {Math.floor(Math.random() * 15) + 5} 分钟
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() =>
                  handleArriveParking({
                    id: `parking_${selectedDestination.id}`,
                    name: `${selectedDestination.name}停车场`,
                  })
                }
                disabled={navigationProgress < 100}
              >
                {navigationProgress < 100
                  ? `正在驾驶 (${navigationProgress}%)`
                  : "已到达停车场"}
              </Button>
            </Paper>
          </Box>
        )}

        {activeStep === 3 && parkingSpots && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Typography variant="h5" gutterBottom>
                寻找停车位
              </Typography>
              <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  推荐停车位: {parkingSpots.recommended_spot?.id}
                </Typography>

                <Box
                  sx={{
                    height: "280px",
                    bgcolor: "#333333",
                    p: 2,
                    borderRadius: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gridTemplateRows: "repeat(6, 1fr)",
                    gap: 1,
                  }}
                >
                  {parkingSpots.spots &&
                    Object.values(parkingSpots.spots).map((spot) => (
                      <Box
                        key={spot.id}
                        sx={{
                          gridColumn: spot.col + 1,
                          gridRow: spot.row + 1,
                          bgcolor: spot.is_occupied
                            ? "error.dark"
                            : spot.id === parkingSpots.recommended_spot?.id
                            ? "success.main"
                            : "success.dark",
                          border:
                            spot.id === parkingSpots.recommended_spot?.id
                              ? "2px solid white"
                              : "none",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "0.7rem",
                          fontWeight:
                            spot.id === parkingSpots.recommended_spot?.id
                              ? "bold"
                              : "normal",
                        }}
                      >
                        {spot.id}
                      </Box>
                    ))}
                </Box>
              </Box>

              <Alert
                severity="success"
                icon={<LocalParkingIcon fontSize="inherit" />}
                sx={{ mb: 2, bgcolor: "#0a3d12", color: "white" }}
              >
                系统已为您预留停车位 {parkingSpots.recommended_spot?.id}，位于{" "}
                {selectedDestination.name}附近。
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                导航指引:
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • 进入停车场大门
                </Typography>
                {parkingSpots.recommended_spot && (
                  <>
                    <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                      • 前往
                      {Math.floor(
                        (parkingSpots.recommended_spot?.row || 0) / 2
                      ) + 1}
                      层
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                      • 沿
                      {(parkingSpots.recommended_spot?.row || 0) % 2 === 0
                        ? "左"
                        : "右"}
                      侧行驶
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                      • 您的车位位于
                      {String.fromCharCode(
                        65 + (parkingSpots.recommended_spot?.row || 0)
                      )}
                      区
                    </Typography>
                  </>
                )}
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={completeParking}
              >
                已完成停车
              </Button>
            </Paper>
          </Box>
        )}

        {activeStep === 4 && isParked && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <CheckCircleIcon
                  sx={{ fontSize: 80, color: "success.main", mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  停车成功！
                </Typography>
              </Box>

              <Alert
                severity="info"
                sx={{ mb: 3, bgcolor: "#0d3b54", color: "white" }}
              >
                请记住您的停车位置: {parkingSpots.recommended_spot?.id}
              </Alert>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  停车详情:
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • 停车场: {selectedDestination.name}停车场
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • 停车位: {parkingSpots.recommended_spot?.id}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • 计时开始: {new Date().toLocaleTimeString()}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • 车辆: {selectedVehicle?.name}
                </Typography>
              </Box>

              <Alert
                severity="warning"
                sx={{ mb: 3, bgcolor: "#614d03", color: "white" }}
              >
                为方便您找回车辆，我们已将您的停车位置保存至您的历史记录。
              </Alert>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={resetNavigation}
              >
                返回主页
              </Button>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;

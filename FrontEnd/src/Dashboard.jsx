import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  AppBar,
  Toolbar,
  CircularProgress,
} from "@mui/material";
import VehicleSelector from "./components/VehicleSelector";
import DestinationSelector from "./components/DestinationSelector";
import CityMapRoute from "./components/CityMapRoute";
import ParkingLot3DScene from "./scenes/ParkingLot3DScene";
import ParkingSuccess from "./components/ParkingSuccess";
import InfoPanel from "./components/InfoPanel";
import { api } from "./services/api";
import LogoutIcon from "@mui/icons-material/Logout";

// 游戏步骤
const steps = [
  "Select Vehicle",
  "Choose Destination",
  "Drive to Parking Lot",
  "Find and Park",
];

function Dashboard({ user, onSignOut }) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [recommendedSpot, setRecommendedSpot] = useState(null);
  const [aiReasoning, setAiReasoning] = useState("");
  const [navigationInstructions, setNavigationInstructions] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedParking, setSelectedParking] = useState(null);
  const [parkingLotData, setParkingLotData] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  // 启动计时器
  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);

    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    setTimerInterval(interval);
  };

  // 停止计时器
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // 获取车辆数据
  useEffect(() => {
    api
      .getVehicles()
      .then((response) => {
        setVehicles(response.data);
        setLoadingVehicles(false);
      })
      .catch((error) => {
        console.error("Failed to fetch vehicles:", error);
        setLoadingVehicles(false);
      });
  }, []);

  // 获取目的地数据
  useEffect(() => {
    api
      .getDestinations()
      .then((response) => {
        setDestinations(response.data);
        setLoadingDestinations(false);
      })
      .catch((error) => {
        console.error("Failed to fetch destinations:", error);
        setLoadingDestinations(false);
      });
  }, []);

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // 处理车辆选择
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveStep(1);
  };

  // 处理目的地选择
  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination);
    setActiveStep(2);
    startTimer();
  };

  // 处理到达停车场
  const handleArriveParking = (parking) => {
    setSelectedParking(parking);
    setLoading(true);

    // 获取停车场详情和推荐车位
    api
      .getParkingLotDetails(parking.id)
      .then((data) => {
        setParkingLotData(data);

        // 获取AI推荐车位
        return api.getRecommendedSpot(
          parking.id,
          selectedVehicle,
          selectedDestination
        );
      })
      .then((recommendation) => {
        setRecommendedSpot(recommendation.spot);
        setAiReasoning(recommendation.reasoning);
        setNavigationInstructions(recommendation.navigation_instructions);
        setActiveStep(3);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting parking details:", error);
        setLoading(false);
      });
  };

  // 处理停车成功
  const handleParkingSuccess = () => {
    stopTimer();
    setActiveStep(4);
  };

  // 重置游戏
  const handleReset = () => {
    setActiveStep(0);
    setSelectedVehicle(null);
    setSelectedDestination(null);
    setRecommendedSpot(null);
    setAiReasoning("");
    setNavigationInstructions([]);
    setTimeElapsed(0);
    setSelectedParking(null);
    setParkingLotData(null);
    stopTimer();
  };

  // 获取当前步骤内容
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return loadingVehicles ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <VehicleSelector
            vehicles={vehicles}
            onSelectVehicle={handleVehicleSelect}
          />
        );
      case 1:
        return loadingDestinations ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DestinationSelector
            destinations={destinations}
            onSelectDestination={handleDestinationSelect}
          />
        );
      case 2:
        return (
          <CityMapRoute
            startLocation={{ lat: -36.848, lng: 174.763 }} // 奥克兰市中心
            destination={selectedDestination}
            vehicle={selectedVehicle}
            onArriveParking={handleArriveParking}
          />
        );
      case 3:
        return (
          <ParkingLot3DScene
            parkingLotData={parkingLotData}
            vehicle={selectedVehicle}
            recommendedSpot={recommendedSpot}
            aiReasoning={aiReasoning}
            navigationInstructions={navigationInstructions}
            onParkingSuccess={handleParkingSuccess}
          />
        );
      case 4:
        return (
          <ParkingSuccess
            vehicle={selectedVehicle}
            destination={selectedDestination}
            parkingSpot={recommendedSpot}
            timeElapsed={timeElapsed}
            onReset={handleReset}
          />
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SmartPark Auckland
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {user.attributes?.email || "User"}
            </Typography>
            <Button
              color="inherit"
              onClick={onSignOut}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h4" align="center" gutterBottom>
            Intelligent Parking Experience System
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 2 }}>{getStepContent(activeStep)}</Box>
        </Paper>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            ITS Course Assessment Project - AI-based Smart Parking System
          </Typography>
        </Box>
      </Container>

      {/* 信息面板 - 显示当前游戏状态 */}
      {activeStep > 0 && activeStep < 4 && (
        <InfoPanel
          vehicle={selectedVehicle}
          destination={selectedDestination}
          timeElapsed={timeElapsed}
          step={activeStep}
          recommendedSpot={recommendedSpot}
        />
      )}
    </>
  );
}

export default Dashboard;

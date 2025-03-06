import React from "react";
import { Paper, Typography, Box, Divider } from "@mui/material";
// 修复大小写问题，确保路径与实际文件系统匹配
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocalParkingIcon from "@mui/icons-material/LocalParking";

const InfoPanel = ({
  vehicle,
  destination,
  timeElapsed,
  step,
  recommendedSpot,
}) => {
  // 格式化时间
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${
      remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds
    }`;
  };

  // 获取当前步骤名称
  const getStepName = () => {
    switch (step) {
      case 1:
        return "Select Destination";
      case 2:
        return "Driving";
      case 3:
        return "Parking";
      default:
        return "Unknown Step";
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        top: 80,
        right: 20,
        width: 240,
        p: 2,
        borderRadius: 2,
        bgcolor: "rgba(42, 42, 42, 0.9)",
        backdropFilter: "blur(5px)",
        zIndex: 1000,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        Current Status
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="body2">
          Time Elapsed: {formatTime(timeElapsed)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <DirectionsCarIcon fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="body2" noWrap>
          Vehicle: {vehicle.name}
        </Typography>
      </Box>

      {destination && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" noWrap>
            Destination: {destination.name}
          </Typography>
        </Box>
      )}

      {recommendedSpot && step === 3 && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LocalParkingIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" noWrap>
            Recommended Spot: {recommendedSpot.id}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mt: 1,
        }}
      >
        <Typography variant="caption" color="primary">
          Current Step: {getStepName()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default InfoPanel;

import React from 'react';
import { Box, Typography, Paper, Button, Grid, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalParkingIcon from "@mui/icons-material/LocalParking";

const ParkingSuccess = ({
  vehicle,
  destination,
  parkingSpot,
  timeElapsed,
  onReset,
}) => {
  // 将秒数转换为分钟和秒
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // 计算停车费用
  const calculateCost = () => {
    // 基础费率
    const baseRate = 2.5;
    // 车辆尺寸额外费率
    const vehicleSizeFactor = vehicle.width * vehicle.length > 9 ? 1.5 : 1;
    // 时间因素 (每小时)
    const timeHours = timeElapsed / 3600;
    // 最终费用
    return (baseRate * vehicleSizeFactor * (1 + timeHours)).toFixed(2);
  };

  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: "success.main" }} />
      </Box>

      <Typography variant="h4" gutterBottom>
        Parking Successfully Completed!
      </Typography>

      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        You have successfully parked your vehicle near {destination.name}.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto", mb: 4 }}>
        <Typography variant="h6" gutterBottom align="left">
          Parking Summary
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
              <DirectionsCarIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Vehicle
                </Typography>
                <Typography variant="body1">{vehicle.name}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
              <LocationOnIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Destination
                </Typography>
                <Typography variant="body1">{destination.name}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
              <LocalParkingIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Parking Spot
                </Typography>
                <Typography variant="body1">
                  {parkingSpot.id}
                  {parkingSpot.type && (
                    <Chip
                      size="small"
                      label={parkingSpot.type}
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Time Used
                </Typography>
                <Typography variant="body1">
                  {formatTime(timeElapsed)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Parking Fee</Typography>
              <Typography variant="h5" color="primary.main">
                ${calculateCost()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          AI Smart Parking Evaluation
        </Typography>
        <Typography variant="body1" paragraph>
          With AI assistance, your parking process was highly efficient! The
          system found the most suitable spot {parkingSpot.id} near{" "}
          {destination.name} for your {vehicle.name}, and successfully guided
          you to complete parking. Total time: {formatTime(timeElapsed)}, which
          is below the average parking time for similar vehicles.
        </Typography>
      </Box>

      <Button variant="contained" size="large" onClick={onReset}>
        Try Again
      </Button>
    </Box>
  );
};

export default ParkingSuccess;

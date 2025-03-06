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
          setError("Authentication information incomplete");
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Error retrieving data");
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
        console.error("Error fetching parking lot details:", err);
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
          Loading...
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
          Login Required
        </Button>
      </Box>
    );
  }

  const steps = [
    "Select Destination",
    "Confirm Route",
    "Navigate to Parking",
    "Find Parking Spot",
    "Parking Complete",
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
            Smart Parking System
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {currentUser?.email || "User"}
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
                Confirm Your Destination
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
                    Category: {selectedDestination.category}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Select Your Vehicle:
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
                Confirm and Start Navigation
              </Button>
            </Paper>
          </Box>
        )}

        {activeStep === 2 && selectedDestination && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Typography variant="h5" gutterBottom>
                Navigate to: {selectedDestination.name}
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
                <Typography variant="subtitle1">Navigation Info</Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  From: Auckland City Center
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  To: {selectedDestination.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  Distance: {Math.floor(Math.random() * 5) + 2} km
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  Estimated Time: {Math.floor(Math.random() * 15) + 5} min
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() =>
                  handleArriveParking({
                    id: `parking_${selectedDestination.id}`,
                    name: `${selectedDestination.name} Parking`,
                  })
                }
                disabled={navigationProgress < 100}
              >
                {navigationProgress < 100
                  ? `Driving (${navigationProgress}%)`
                  : "Arrived at Parking Lot"}
              </Button>
            </Paper>
          </Box>
        )}

        {activeStep === 3 && parkingSpots && (
          <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Typography variant="h5" gutterBottom>
                Find Parking Spot
              </Typography>
              <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recommended Parking Spot: {parkingSpots.recommended_spot?.id}
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
                System has reserved parking spot{" "}
                {parkingSpots.recommended_spot?.id} for you, located near{" "}
                {selectedDestination.name}.
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                Navigation Instructions:
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • Enter the parking garage
                </Typography>
                {parkingSpots.recommended_spot && (
                  <>
                    <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                      • Go to level{" "}
                      {Math.floor(
                        (parkingSpots.recommended_spot?.row || 0) / 2
                      ) + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                      • Drive along the{" "}
                      {(parkingSpots.recommended_spot?.row || 0) % 2 === 0
                        ? "left"
                        : "right"}{" "}
                      side
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                      • Your spot is in section{" "}
                      {String.fromCharCode(
                        65 + (parkingSpots.recommended_spot?.row || 0)
                      )}
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
                Parking Complete
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
                  Parking Successful!
                </Typography>
              </Box>

              <Alert
                severity="info"
                sx={{ mb: 3, bgcolor: "#0d3b54", color: "white" }}
              >
                Please remember your parking location:{" "}
                {parkingSpots.recommended_spot?.id}
              </Alert>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Parking Details:
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • Parking Facility: {selectedDestination.name} Parking
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • Parking Spot: {parkingSpots.recommended_spot?.id}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • Time Started: {new Date().toLocaleTimeString()}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  • Vehicle: {selectedVehicle?.name}
                </Typography>
              </Box>

              <Alert
                severity="warning"
                sx={{ mb: 3, bgcolor: "#614d03", color: "white" }}
              >
                To help you find your vehicle later, we've saved your parking
                location to your history.
              </Alert>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={resetNavigation}
              >
                Return to Home
              </Button>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;

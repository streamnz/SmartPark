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
  Card,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DestinationSelector from "./DestinationSelector";
import axios from "axios";

// Update API base URL
const API_BASE_URL = "http://localhost:5001/api";

function Dashboard() {
  const { currentUser, accessToken, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      try {
        // Check if we have user info and access token
        if (currentUser && accessToken) {
          console.log("User authenticated:", currentUser);
          setAuthenticated(true);
          // Fetch destinations after successful authentication
          fetchDestinations();
        } else {
          console.error("Missing user info or access token");
          setError("Authentication information incomplete");
        }
      } catch (err) {
        console.error("Error verifying user:", err);
        setError("Error verifying user");
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, [currentUser, accessToken]);

  const fetchDestinations = async () => {
    try {
      // Updated API URL to use localhost:5001
      const response = await axios.get(`${API_BASE_URL}/destinations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDestinations(response.data);
    } catch (error) {
      console.error("Error fetching destinations:", error);

      // Fallback mock data in case API is not available
      setDestinations([
        {
          id: 1,
          name: "Central Business District",
          address: "123 Queen Street, Auckland",
          category: "Business",
          availableSpots: 45,
        },
        {
          id: 2,
          name: "Auckland Hospital",
          address: "2 Park Road, Grafton",
          category: "Healthcare",
          availableSpots: 20,
        },
        {
          id: 3,
          name: "Auckland University",
          address: "22 Princes Street, Auckland",
          category: "Education",
          availableSpots: 30,
        },
      ]);
    }
  };

  const handleDestinationSelect = (destination) => {
    setSelectedDestination(destination);
    setActiveStep(1);
  };

  const startNavigation = async () => {
    try {
      // Call the backend API to start navigation if needed
      // const response = await axios.post(`${API_BASE_URL}/parking/navigate`, {
      //   destinationId: selectedDestination.id
      // }, {
      //   headers: { Authorization: `Bearer ${accessToken}` }
      // });

      setGameStarted(true);
      setActiveStep(2);
      console.log("Navigation started to:", selectedDestination.name);
    } catch (error) {
      console.error("Error starting navigation:", error);
      setError("Failed to start navigation");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 4,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading dashboard...
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
          Return to Login
        </Button>
      </Box>
    );
  }

  const steps = ["Select Destination", "Confirm Details", "Start Navigation"];

  return (
    <Box className="dashboard" sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Smart Parking System
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5">
            Welcome, {currentUser?.email || "User"}
          </Typography>

          {authenticated ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: "success.main",
              }}
            >
              <CheckCircleIcon sx={{ mr: 1 }} />
              <Typography>Connected</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: "error.main",
              }}
            >
              <ErrorIcon sx={{ mr: 1 }} />
              <Typography>Authentication issue</Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your Destination
            </Typography>
            <DestinationSelector
              destinations={destinations}
              onSelectDestination={handleDestinationSelect}
            />
          </Box>
        )}

        {activeStep === 1 && selectedDestination && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Destination Details
            </Typography>
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="h5">{selectedDestination.name}</Typography>
              <Typography variant="body1">
                {selectedDestination.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Parking Spots:{" "}
                {selectedDestination.availableSpots || "Unknown"}
              </Typography>
              <Box
                sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}
              >
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Change Destination
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={startNavigation}
                >
                  Confirm & Start Navigation
                </Button>
              </Box>
            </Card>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Navigation Started!
            </Typography>
            <Typography variant="body1">
              You are now navigating to {selectedDestination?.name}. Follow the
              directions on your screen.
            </Typography>
            {/* You could include a map or navigation interface here */}
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 3 }}
              onClick={() => setActiveStep(0)}
            >
              Reset Navigation
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" color="secondary" onClick={logout}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Dashboard;

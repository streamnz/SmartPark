import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Grid,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ElectricCarIcon from "@mui/icons-material/ElectricCar";
import AccessibleIcon from "@mui/icons-material/Accessible";
import LocalParkingIcon from "@mui/icons-material/LocalParking";

// Simplified parking slot component
const ParkingSlot = ({ id, isOccupied, type, onClick, isSelected }) => {
  // Define styles based on state
  let bgColor = "rgba(74, 222, 128, 0.2)"; // Default available
  let borderColor = "#4ade80";
  let icon = null;
  let tooltipTitle = `Spot ${id}: Available`;

  if (isOccupied) {
    bgColor = "rgba(220, 38, 38, 0.2)";
    borderColor = "#ef4444";
    tooltipTitle = `Spot ${id}: Occupied`;
    icon = <DirectionsCarIcon sx={{ color: "#ef4444" }} />;
  } else if (isSelected) {
    bgColor = "rgba(59, 130, 246, 0.3)";
    borderColor = "#3b82f6";
    tooltipTitle = `Spot ${id}: Selected`;
    icon = <CheckCircleIcon sx={{ color: "#3b82f6" }} />;
  }

  // Special spot icons
  if (type === "disabled" && !isOccupied) {
    icon = <AccessibleIcon sx={{ color: "#4ade80" }} />;
    tooltipTitle += " (Accessible)";
  } else if (type === "ev" && !isOccupied) {
    icon = <ElectricCarIcon sx={{ color: "#4ade80" }} />;
    tooltipTitle += " (EV Charging)";
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Box
        onClick={!isOccupied ? onClick : undefined}
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: !isOccupied ? "pointer" : "default",
          "&:hover": !isOccupied
            ? {
                transform: "scale(1.05)",
              }
            : {},
        }}
      >
        {icon}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            bottom: 2,
            right: 4,
            fontWeight: "bold",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {id}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// Simplified ParkingLotView component
const ParkingLotView = ({ open, onClose, onParkingComplete, lot }) => {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTimeoutId, setSuccessTimeoutId] = useState(null);

  // Clean up on unmount and when dialog closes
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
      setShowSuccess(false);
    };
  }, [successTimeoutId]);

  // Also clean up when dialog closes
  useEffect(() => {
    if (!open) {
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
      setShowSuccess(false);
    }
  }, [open, successTimeoutId]);

  // Generate simplified parking spots data
  useEffect(() => {
    if (open) {
      // Get spots total and available count from lot props, or use defaults
      const totalSpots = lot?.total_spots || 50;
      const availableSpots = lot?.available_spots || 20;

      // Calculate occupied spots count
      const occupiedCount = totalSpots - availableSpots;

      // Determine rows and columns (assume 5 rows)
      const rows = 5;
      const cols = Math.ceil(totalSpots / rows);

      // Simple grid layout
      const spots = [];
      const occupiedSpots = new Set();

      // Randomly generate occupied spots
      while (occupiedSpots.size < occupiedCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const spotId = `${String.fromCharCode(65 + row)}${col + 1}`;
        occupiedSpots.add(spotId);
      }

      // Add some special spots
      const specialSpots = {
        A1: "disabled",
        A10: "ev",
        E1: "disabled",
        E10: "ev",
      };

      // Generate all spots
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Stop if exceeding total spots
          if (row * cols + col >= totalSpots) break;

          const spotId = `${String.fromCharCode(65 + row)}${col + 1}`;
          spots.push({
            id: spotId,
            row,
            col,
            isOccupied: occupiedSpots.has(spotId),
            type: specialSpots[spotId] || "standard",
          });
        }
      }

      setParkingSpots(spots);
      setSelectedSpot(null); // Reset selection when dialog opens
    }
  }, [open, lot]);

  // Handle spot selection
  const handleSpotSelection = (spot) => {
    if (!spot.isOccupied) {
      setSelectedSpot(spot);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    // Clear any pending success notification
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
      setSuccessTimeoutId(null);
    }
    setShowSuccess(false);

    if (onClose) {
      onClose();
    }
  };

  // Complete reservation
  const handleCompletePark = () => {
    if (selectedSpot) {
      setShowSuccess(true);

      // Close dialog with delay to show success message
      const timeoutId = setTimeout(() => {
        if (onParkingComplete) {
          // Create parking info
          const currentTime = new Date();
          const expirationTime = new Date(
            currentTime.getTime() + 3 * 60 * 60 * 1000
          ); // Default 3 hours parking time

          onParkingComplete({
            spot: selectedSpot,
            parkingLot: lot,
            parkingInfo: {
              hourlyRate: lot?.hourly_rate || 5.5,
              startTime: currentTime,
              expirationTime: expirationTime,
              level: `Level 1 - Section ${selectedSpot.id.charAt(0)}`,
              type:
                selectedSpot.type === "disabled"
                  ? "Accessible Spot"
                  : selectedSpot.type === "ev"
                  ? "EV Charging Spot"
                  : "Standard Spot",
            },
            allowReset: true,
          });
        }

        // Clear and close
        setShowSuccess(false);
        setSuccessTimeoutId(null);

        // Close dialog after callback
        handleClose();
      }, 600);

      // Store timeout ID for cleanup
      setSuccessTimeoutId(timeoutId);
    }
  };

  // Handle success alert close
  const handleSnackbarClose = () => {
    setShowSuccess(false);
  };

  // Group spots by row for rendering
  const spotsByRow = parkingSpots.reduce((acc, spot) => {
    if (!acc[spot.row]) acc[spot.row] = [];
    acc[spot.row][spot.col] = spot;
    return acc;
  }, []);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#1a1a1a",
            color: "white",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            bgcolor: "#121212",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LocalParkingIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {lot?.name || "Parking Lot"} - Top View
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{ color: "white" }}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#1a1a1a" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.05)",
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="primary">
                Available Spots
              </Typography>
              <Typography variant="h5" color="success.light">
                {lot?.available_spots || 20}
                <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                  / {lot?.total_spots || 50}
                </Typography>
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary">
                Hourly Rate
              </Typography>
              <Typography variant="h5" color="warning.light">
                ${lot?.hourly_rate || "5.50"}/hour
              </Typography>
            </Box>

            <Box>
              {selectedSpot ? (
                <Typography variant="subtitle1">
                  Selected spot:
                  <Box
                    component="span"
                    sx={{ fontWeight: "bold", ml: 1, color: "primary.light" }}
                  >
                    {selectedSpot.id}
                  </Box>
                </Typography>
              ) : (
                <Typography
                  variant="subtitle1"
                  sx={{ fontStyle: "italic", opacity: 0.7 }}
                >
                  Please select an available spot
                </Typography>
              )}
            </Box>
          </Box>

          {/* Parking layout */}
          <Paper
            elevation={3}
            sx={{
              p: 2,
              bgcolor: "#121212",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    bgcolor: "rgba(74, 222, 128, 0.2)",
                    border: "2px solid #4ade80",
                    borderRadius: 1,
                    mr: 1,
                  }}
                />
                <Typography variant="caption">Available</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    bgcolor: "rgba(220, 38, 38, 0.2)",
                    border: "2px solid #ef4444",
                    borderRadius: 1,
                    mr: 1,
                  }}
                />
                <Typography variant="caption">Occupied</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessibleIcon
                  sx={{ fontSize: 14, color: "#4ade80", mr: 1 }}
                />
                <Typography variant="caption">Accessible</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ElectricCarIcon
                  sx={{ fontSize: 14, color: "#4ade80", mr: 1 }}
                />
                <Typography variant="caption">EV Charging</Typography>
              </Box>
            </Box>

            <Grid container spacing={1}>
              {spotsByRow.map((row, rowIndex) => (
                <Grid item xs={12} key={`row-${rowIndex}`}>
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    {row.map((spot) => (
                      <Grid item xs={1.2} key={spot.id} sx={{ height: 50 }}>
                        <ParkingSlot
                          id={spot.id}
                          isOccupied={spot.isOccupied}
                          type={spot.type}
                          isSelected={selectedSpot?.id === spot.id}
                          onClick={() => handleSpotSelection(spot)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Typography
            variant="body2"
            sx={{ opacity: 0.7, fontStyle: "italic", mt: 1 }}
          >
            Click to select an empty parking spot
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompletePark}
            variant="contained"
            color="success"
            disabled={!selectedSpot}
          >
            Reserve Spot {selectedSpot?.id}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success notification - with auto-hide and manual close */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
          onClose={handleSnackbarClose}
        >
          Successfully reserved spot {selectedSpot?.id}!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ParkingLotView;

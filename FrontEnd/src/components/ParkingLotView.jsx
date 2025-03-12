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
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ElectricCarIcon from "@mui/icons-material/ElectricCar";
import AccessibleIcon from "@mui/icons-material/Accessible";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Simplified parking slot component
const ParkingSlot = ({
  id,
  isOccupied,
  type,
  onClick,
  isSelected,
  isMobile,
}) => {
  // Define styles based on state
  let bgColor = "rgba(74, 222, 128, 0.2)"; // Default available
  let borderColor = "#4ade80";
  let icon = null;
  let tooltipTitle = `Spot ${id}: Available`;

  if (isOccupied) {
    bgColor = "rgba(220, 38, 38, 0.2)";
    borderColor = "#ef4444";
    tooltipTitle = `Spot ${id}: Occupied`;
    icon = (
      <DirectionsCarIcon
        sx={{ color: "#ef4444", fontSize: isMobile ? "0.9rem" : "1.2rem" }}
      />
    );
  } else if (isSelected) {
    bgColor = "rgba(59, 130, 246, 0.3)";
    borderColor = "#3b82f6";
    tooltipTitle = `Spot ${id}: Selected`;
    icon = (
      <CheckCircleIcon
        sx={{ color: "#3b82f6", fontSize: isMobile ? "0.9rem" : "1.2rem" }}
      />
    );
  }

  // Special spot icons
  if (type === "disabled" && !isOccupied) {
    icon = (
      <AccessibleIcon
        sx={{ color: "#4ade80", fontSize: isMobile ? "0.9rem" : "1.2rem" }}
      />
    );
    tooltipTitle += " (Accessible)";
  } else if (type === "ev" && !isOccupied) {
    icon = (
      <ElectricCarIcon
        sx={{ color: "#4ade80", fontSize: isMobile ? "0.9rem" : "1.2rem" }}
      />
    );
    tooltipTitle += " (EV Charging)";
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Box
        onClick={!isOccupied ? onClick : undefined}
        sx={{
          width: "100%",
          height: isMobile ? 30 : 40,
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
          "&:active":
            !isOccupied && isMobile
              ? {
                  transform: "scale(0.98)",
                  transition: "transform 0.1s",
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
            right: 3,
            fontWeight: "bold",
            color: "rgba(255,255,255,0.7)",
            fontSize: isMobile ? "0.6rem" : "0.75rem",
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

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

  // Mobile view uses bottom swipeable drawer
  if (isMobile) {
    return (
      <>
        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={handleClose}
          onOpen={() => {}}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              minHeight: "94vh",
              maxHeight: "94vh",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              bgcolor: "#1a1a1a",
              color: "white",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 40,
                height: 4,
                backgroundColor: "rgba(255,255,255,0.3)",
                borderRadius: 4,
                zIndex: 10,
              },
            },
          }}
          sx={{
            ".MuiDrawer-paper": {
              overflow: "hidden",
            },
          }}
        >
          {/* Header */}
          <Box sx={{ pt: 3, pb: 1, px: 2, bgcolor: "#121212" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LocalParkingIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle1">
                  {lot?.name || "Parking Lot"} - Select a Spot
                </Typography>
              </Box>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
                sx={{ p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Parking info */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              bgcolor: "rgba(255,255,255,0.05)",
              p: 1.5,
              borderRadius: 0,
            }}
          >
            <Box>
              <Typography variant="caption" color="primary">
                Available Spots
              </Typography>
              <Typography
                variant="body1"
                color="success.light"
                sx={{ fontWeight: 500 }}
              >
                {lot?.available_spots || 20}
                <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                  / {lot?.total_spots || 50}
                </Typography>
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="primary">
                Rate
              </Typography>
              <Typography
                variant="body1"
                color="warning.light"
                sx={{ fontWeight: 500 }}
              >
                ${lot?.hourly_rate || "5.50"}/hr
              </Typography>
            </Box>

            <Box>
              {selectedSpot ? (
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="primary">
                    Selected
                  </Typography>
                  <Typography
                    variant="body1"
                    color="primary.light"
                    sx={{ fontWeight: 500 }}
                  >
                    {selectedSpot.id}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    fontStyle: "italic",
                    opacity: 0.7,
                    mt: 1,
                    display: "block",
                  }}
                >
                  Select a spot
                </Typography>
              )}
            </Box>
          </Box>

          {/* Legend */}
          <Box
            sx={{
              px: 1.5,
              pt: 1.5,
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: "rgba(74, 222, 128, 0.2)",
                  border: "2px solid #4ade80",
                  borderRadius: 1,
                  mr: 0.5,
                }}
              />
              <Typography variant="caption">Available</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: "rgba(220, 38, 38, 0.2)",
                  border: "2px solid #ef4444",
                  borderRadius: 1,
                  mr: 0.5,
                }}
              />
              <Typography variant="caption">Occupied</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccessibleIcon
                sx={{ fontSize: 12, color: "#4ade80", mr: 0.5 }}
              />
              <Typography variant="caption">Accessible</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ElectricCarIcon
                sx={{ fontSize: 12, color: "#4ade80", mr: 0.5 }}
              />
              <Typography variant="caption">EV Charging</Typography>
            </Box>
          </Box>

          {/* Parking layout - scrollable area */}
          <Box
            sx={{
              p: 1.5,
              overflow: "auto",
              flexGrow: 1,
              maxHeight: "calc(94vh - 215px)",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Parking Map - Level 1
            </Typography>

            <Paper
              elevation={1}
              sx={{
                p: 1,
                bgcolor: "#121212",
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Grid container spacing={0.5}>
                {spotsByRow.map((row, rowIndex) => (
                  <Grid item xs={12} key={`row-${rowIndex}`}>
                    <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
                      {row.map((spot) => (
                        <Grid item xs={1.2} key={spot.id} sx={{ height: 30 }}>
                          <ParkingSlot
                            id={spot.id}
                            isOccupied={spot.isOccupied}
                            type={spot.type}
                            isSelected={selectedSpot?.id === spot.id}
                            onClick={() => handleSpotSelection(spot)}
                            isMobile={true}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Help text */}
            <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1.5 }}>
              <InfoOutlinedIcon
                sx={{ fontSize: "0.9rem", mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Tap any available spot to select it
              </Typography>
            </Box>
          </Box>

          {/* Bottom actions */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: "rgba(18,18,18,0.9)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={5}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleClose}
                  size="small"
                  sx={{
                    py: 1,
                    color: "white",
                    borderColor: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      borderColor: "white",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Grid>
              <Grid item xs={7}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={!selectedSpot}
                  onClick={handleCompletePark}
                  size="small"
                  sx={{ py: 1 }}
                >
                  Reserve Spot {selectedSpot?.id}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </SwipeableDrawer>

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
  }

  // Desktop/Tablet version - Keep the dialog version with some enhancements
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
            p: isTablet ? 1.5 : 2,
            bgcolor: "#121212",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LocalParkingIcon sx={{ mr: 1 }} />
            <Typography variant={isTablet ? "subtitle1" : "h6"}>
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

        <DialogContent sx={{ p: isTablet ? 2 : 3, bgcolor: "#1a1a1a" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: isTablet ? 2 : 3,
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
                          isMobile={false}
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
          sx={{
            p: isTablet ? 1.5 : 2,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
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

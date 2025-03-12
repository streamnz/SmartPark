import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PaidIcon from "@mui/icons-material/Paid";
import PlaceIcon from "@mui/icons-material/Place";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ElectricCarIcon from "@mui/icons-material/ElectricCar";
import AccessibleIcon from "@mui/icons-material/Accessible";
import { api } from "../services/api";

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reservation-tabpanel-${index}`}
      aria-labelledby={`reservation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Format date for display
const formatDate = (dateString) => {
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Calculate duration between two dates in hours and minutes
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

// Get appropriate icon for spot type
const getSpotTypeIcon = (type) => {
  switch (type) {
    case "disabled":
      return <AccessibleIcon />;
    case "ev_charging":
      return <ElectricCarIcon />;
    default:
      return <DirectionsCarIcon />;
  }
};

// Get display name for spot type
const getSpotTypeName = (type) => {
  switch (type) {
    case "disabled":
      return "Accessible";
    case "ev_charging":
      return "EV Charging";
    case "compact":
      return "Compact";
    case "large":
      return "Large";
    default:
      return "Standard";
  }
};

// Status chip component
const StatusChip = ({ status }) => {
  if (status === "active") {
    return (
      <Chip
        icon={<HourglassEmptyIcon />}
        label="Active"
        color="primary"
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  } else if (status === "completed") {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Completed"
        color="success"
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  } else if (status === "canceled") {
    return (
      <Chip
        label="Canceled"
        color="error"
        size="small"
        sx={{ fontWeight: "bold" }}
      />
    );
  }
  return null;
};

// Reservation history component
const ReservationHistory = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load reservations when dialog opens
  useEffect(() => {
    if (open) {
      loadReservations();
    }
  }, [open]);

  // Load reservation data
  const loadReservations = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getReservations();
      if (result && result.data) {
        setReservations(result.data);
      }
    } catch (err) {
      console.error("Failed to load reservations:", err);
      setError("Failed to load your parking history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter reservations by status
  const activeReservations = reservations.filter(
    (res) => res.status === "active"
  );
  const completedReservations = reservations.filter(
    (res) => res.status === "completed"
  );
  const canceledReservations = reservations.filter(
    (res) => res.status === "canceled"
  );

  // Cancel a reservation
  const handleCancelReservation = async (reservationId) => {
    try {
      await api.cancelReservation(reservationId);
      // Refresh reservations after cancellation
      loadReservations();
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      setError("Failed to cancel reservation. Please try again.");
    }
  };

  // Reservation card component
  const ReservationCard = ({ reservation }) => {
    return (
      <Card
        sx={{
          mb: 2,
          bgcolor: "rgba(32,33,36,0.9)",
          boxShadow: 3,
          transition: "transform 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 6,
          },
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LocalParkingIcon
                sx={{ color: "primary.main", mr: 1, fontSize: 28 }}
              />
              <Box>
                <Typography variant="h6" component="div">
                  {reservation.parking_lot_name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <PlaceIcon
                    sx={{ fontSize: 16, mr: 0.5, color: "error.light" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {reservation.destination_name}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <StatusChip status={reservation.status} />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 140 }}>
              <Tooltip title={getSpotTypeName(reservation.spot_type)}>
                <Box sx={{ mr: 1, color: "primary.light" }}>
                  {getSpotTypeIcon(reservation.spot_type)}
                </Box>
              </Tooltip>
              <Typography variant="h5" color="primary.light" fontWeight="bold">
                {reservation.spot_id}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PaidIcon sx={{ mr: 1, color: "warning.light", fontSize: 20 }} />
              <Typography variant="body1">
                ${parseFloat(reservation.hourly_rate).toFixed(2)}/hour
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccessTimeIcon
                sx={{ mr: 1, color: "info.light", fontSize: 20 }}
              />
              <Typography variant="body1">
                {calculateDuration(
                  reservation.reservation_time,
                  reservation.expiration_time
                )}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarTodayIcon
                  sx={{ mr: 1, color: "text.secondary", fontSize: 18 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Start: {formatDate(reservation.reservation_time)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon
                  sx={{ mr: 1, color: "text.secondary", fontSize: 18 }}
                />
                <Typography variant="body2" color="text.secondary">
                  End: {formatDate(reservation.expiration_time)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {reservation.status === "active" && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleCancelReservation(reservation.id)}
              >
                Cancel Reservation
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#1a1a1a",
          color: "white",
          borderRadius: 2,
          minHeight: "60vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#121212",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ReceiptIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Parking Reservation History</Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="reservation tabs"
        centered
        sx={{
          bgcolor: "#121212",
          "& .MuiTab-root": {
            color: "rgba(255,255,255,0.7)",
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "primary.main",
          },
        }}
      >
        <Tab label={`All (${reservations.length})`} id="reservation-tab-0" />
        <Tab
          label={`Active (${activeReservations.length})`}
          id="reservation-tab-1"
        />
        <Tab
          label={`Completed (${completedReservations.length})`}
          id="reservation-tab-2"
        />
        <Tab
          label={`Canceled (${canceledReservations.length})`}
          id="reservation-tab-3"
        />
      </Tabs>

      <DialogContent sx={{ p: 0, bgcolor: "#1a1a1a" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "40vh",
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 4,
                  }}
                >
                  <ReceiptIcon
                    sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No parking reservations found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ mt: 1 }}
                  >
                    Your parking reservation history will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {activeReservations.length > 0 ? (
                activeReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 4,
                  }}
                >
                  <HourglassEmptyIcon
                    sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No active reservations
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ mt: 1 }}
                  >
                    You don't have any active parking reservations at the moment
                  </Typography>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {completedReservations.length > 0 ? (
                completedReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 4,
                  }}
                >
                  <CheckCircleIcon
                    sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No completed reservations
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ mt: 1 }}
                  >
                    Your completed parking reservations will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {canceledReservations.length > 0 ? (
                canceledReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 4,
                  }}
                >
                  <CloseIcon
                    sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No canceled reservations
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ mt: 1 }}
                  >
                    Your canceled parking reservations will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReservationHistory;

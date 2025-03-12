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
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
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
      {value === index && <Box sx={{ p: { xs: 1, sm: 2 } }}>{children}</Box>}
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
const StatusChip = ({ status, isMobile }) => {
  if (status === "active") {
    return (
      <Chip
        icon={!isMobile && <HourglassEmptyIcon />}
        label="Active"
        color="primary"
        size="small"
        sx={{
          fontWeight: "bold",
          height: isMobile ? 20 : 24,
          fontSize: isMobile ? "0.675rem" : "0.75rem",
        }}
      />
    );
  } else if (status === "completed") {
    return (
      <Chip
        icon={!isMobile && <CheckCircleIcon />}
        label="Completed"
        color="success"
        size="small"
        sx={{
          fontWeight: "bold",
          height: isMobile ? 20 : 24,
          fontSize: isMobile ? "0.675rem" : "0.75rem",
        }}
      />
    );
  } else if (status === "canceled") {
    return (
      <Chip
        label="Canceled"
        color="error"
        size="small"
        sx={{
          fontWeight: "bold",
          height: isMobile ? 20 : 24,
          fontSize: isMobile ? "0.675rem" : "0.75rem",
        }}
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

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
      setError("Failed to load reservation history. Please try again later.");
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
          mb: isMobile ? 1.5 : 2,
          bgcolor: "rgba(32,33,36,0.9)",
          boxShadow: 3,
          transition: "transform 0.2s",
          "&:hover": {
            transform: isMobile ? "none" : "translateY(-4px)",
            boxShadow: isMobile ? 3 : 6,
          },
          "&:active": isMobile
            ? {
                transform: "scale(0.98)",
                transition: "transform 0.1s",
              }
            : {},
          borderRadius: isMobile ? 1 : 2,
        }}
      >
        <CardContent
          sx={{
            p: isMobile ? 1.5 : 2,
            "&:last-child": {
              pb: isMobile ? 1.5 : 2,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: isMobile ? 1 : 2,
              flexWrap: isMobile ? "wrap" : "nowrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: isMobile ? 0.5 : 0,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <LocalParkingIcon
                sx={{
                  color: "primary.main",
                  mr: 1,
                  fontSize: isMobile ? 20 : 28,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  component="div"
                  sx={{
                    fontSize: isMobile ? "0.95rem" : undefined,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isMobile ? 190 : "none",
                  }}
                >
                  {reservation.parking_lot_name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <PlaceIcon
                    sx={{
                      fontSize: isMobile ? 14 : 16,
                      mr: 0.5,
                      color: "error.light",
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: isMobile ? "0.7rem" : undefined,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: isMobile ? 180 : "none",
                    }}
                  >
                    {reservation.destination_name}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: isMobile ? 0 : "auto", ml: isMobile ? "auto" : 0 }}>
              <StatusChip status={reservation.status} isMobile={isMobile} />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 1 : 2,
              mb: isMobile ? 1.5 : 2,
              alignItems: "center",
              justifyContent: isMobile ? "space-between" : "flex-start",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                minWidth: isMobile ? "auto" : 140,
                mr: isMobile ? 0 : 1,
              }}
            >
              <Tooltip title={getSpotTypeName(reservation.spot_type)}>
                <Box
                  sx={{
                    mr: 0.5,
                    color: "primary.light",
                    fontSize: isMobile ? "0.9rem" : "1rem",
                  }}
                >
                  {getSpotTypeIcon(reservation.spot_type)}
                </Box>
              </Tooltip>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                color="primary.light"
                fontWeight="bold"
                sx={{ fontSize: isMobile ? "1.1rem" : undefined }}
              >
                {reservation.spot_id}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PaidIcon
                sx={{
                  mr: 0.5,
                  color: "warning.light",
                  fontSize: isMobile ? 16 : 20,
                }}
              />
              <Typography
                variant={isMobile ? "body2" : "body1"}
                sx={{ fontSize: isMobile ? "0.75rem" : undefined }}
              >
                ${parseFloat(reservation.hourly_rate).toFixed(2)}/h
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccessTimeIcon
                sx={{
                  mr: 0.5,
                  color: "info.light",
                  fontSize: isMobile ? 16 : 20,
                }}
              />
              <Typography
                variant={isMobile ? "body2" : "body1"}
                sx={{ fontSize: isMobile ? "0.75rem" : undefined }}
              >
                {calculateDuration(
                  reservation.reservation_time,
                  reservation.expiration_time
                )}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: isMobile ? 1.5 : 2 }} />

          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarTodayIcon
                  sx={{
                    mr: 0.5,
                    color: "text.secondary",
                    fontSize: isMobile ? 14 : 18,
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? "0.7rem" : undefined }}
                >
                  {isMobile ? "Start: " : "Start: "}
                  {formatDate(reservation.reservation_time)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon
                  sx={{
                    mr: 0.5,
                    color: "text.secondary",
                    fontSize: isMobile ? 14 : 18,
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? "0.7rem" : undefined }}
                >
                  {isMobile ? "End: " : "End: "}
                  {formatDate(reservation.expiration_time)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {reservation.status === "active" && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: isMobile ? 1.5 : 2,
              }}
            >
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleCancelReservation(reservation.id)}
                sx={{
                  fontSize: isMobile ? "0.7rem" : undefined,
                  py: isMobile ? 0.5 : undefined,
                  px: isMobile ? 1 : undefined,
                }}
              >
                {isMobile ? "Cancel" : "Cancel Reservation"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // 空状态展示组件
  const EmptyState = ({ icon, title, subtitle }) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: isMobile ? 2 : 4,
      }}
    >
      {React.cloneElement(icon, {
        sx: {
          fontSize: isMobile ? 40 : 60,
          color: "text.disabled",
          mb: isMobile ? 1 : 2,
        },
      })}
      <Typography
        variant={isMobile ? "subtitle1" : "h6"}
        color="text.secondary"
        align="center"
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.disabled"
        sx={{ mt: 1, fontSize: isMobile ? "0.75rem" : undefined }}
        align="center"
      >
        {subtitle}
      </Typography>
    </Box>
  );

  // 移动端使用底部抽屉而不是对话框
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
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
        <Box sx={{ pt: 3, pb: 1, px: 2, bgcolor: "#121212" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ReceiptIcon sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle1">
                Parking Reservation History
              </Typography>
            </Box>
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              sx={{ p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="reservation tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: "#121212",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            "& .MuiTab-root": {
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.75rem",
              minWidth: 0,
              p: 1,
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

        <Box
          sx={{
            px: 1,
            overflow: "auto",
            flexGrow: 1,
            maxHeight: "calc(94vh - 110px)",
            WebkitOverflowScrolling: "touch", // 改善iOS滚动体验
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "30vh",
              }}
            >
              <CircularProgress color="primary" size={36} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ fontSize: "0.75rem" }}>
                {error}
              </Alert>
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
                  <EmptyState
                    icon={<ReceiptIcon />}
                    title="No Reservations Found"
                    subtitle="Your parking reservation history will show here"
                  />
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
                  <EmptyState
                    icon={<HourglassEmptyIcon />}
                    title="No Active Reservations"
                    subtitle="You don't have any active parking reservations"
                  />
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
                  <EmptyState
                    icon={<CheckCircleIcon />}
                    title="No Completed Reservations"
                    subtitle="Your completed parking reservations will show here"
                  />
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
                  <EmptyState
                    icon={<CloseIcon />}
                    title="No Canceled Reservations"
                    subtitle="Your canceled parking reservations will show here"
                  />
                )}
              </TabPanel>
            </>
          )}
        </Box>
      </SwipeableDrawer>
    );
  }

  // 桌面和平板设备使用对话框
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
          minHeight: isTablet ? "70vh" : "60vh",
          maxHeight: isTablet ? "90vh" : "80vh",
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
          p: isTablet ? 1.5 : 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ReceiptIcon sx={{ mr: 1, fontSize: isTablet ? 20 : 24 }} />
          <Typography variant={isTablet ? "subtitle1" : "h6"}>
            Parking Reservation History
          </Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          size={isTablet ? "small" : "medium"}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="reservation tabs"
        centered={!isTablet}
        variant={isTablet ? "scrollable" : "standard"}
        scrollButtons={isTablet ? "auto" : undefined}
        sx={{
          bgcolor: "#121212",
          "& .MuiTab-root": {
            color: "rgba(255,255,255,0.7)",
            fontSize: isTablet ? "0.8rem" : undefined,
            minWidth: isTablet ? 0 : 90,
            p: isTablet ? 1 : 2,
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

      <DialogContent
        sx={{
          p: 0,
          bgcolor: "#1a1a1a",
          overflow: "auto",
          maxHeight: isTablet ? "calc(90vh - 120px)" : "calc(80vh - 140px)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "40vh",
            }}
          >
            <CircularProgress color="primary" size={isTablet ? 36 : 40} />
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
                <EmptyState
                  icon={<ReceiptIcon />}
                  title="No Reservations Found"
                  subtitle="Your parking reservation history will show here"
                />
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
                <EmptyState
                  icon={<HourglassEmptyIcon />}
                  title="No Active Reservations"
                  subtitle="You don't have any active parking reservations"
                />
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
                <EmptyState
                  icon={<CheckCircleIcon />}
                  title="No Completed Reservations"
                  subtitle="Your completed parking reservations will show here"
                />
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
                <EmptyState
                  icon={<CloseIcon />}
                  title="No Canceled Reservations"
                  subtitle="Your canceled parking reservations will show here"
                />
              )}
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReservationHistory;

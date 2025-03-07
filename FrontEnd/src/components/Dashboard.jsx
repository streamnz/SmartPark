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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import PlaceIcon from "@mui/icons-material/Place";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NavigationIcon from "@mui/icons-material/Navigation";
import DirectionsIcon from "@mui/icons-material/Directions";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import DestinationSelector from "./DestinationSelector";
import { api } from "../services/api";
import routesService from "../services/routesService";

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
  const [userLocation, setUserLocation] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [mapError, setMapError] = useState("");
  const mapRef = useRef(null);
  const googleMapsRef = useRef(null);
  const directionsRendererRef = useRef(null);

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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(currentLocation);
          setLoadingLocation(false);

          if (selectedDestination && selectedDestination.location) {
            calculateRoute(currentLocation, selectedDestination.location);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          setMapError(
            "Unable to get your current location. Please enable location services."
          );
          setLoadingLocation(false);

          const defaultLocation = { lat: -36.8508, lng: 174.7645 };
          setUserLocation(defaultLocation);

          if (selectedDestination && selectedDestination.location) {
            calculateRoute(defaultLocation, selectedDestination.location);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    } else {
      setMapError("Geolocation is not supported by this browser.");

      const defaultLocation = { lat: -36.8508, lng: 174.7645 };
      setUserLocation(defaultLocation);
    }
  };

  const calculateRoute = async (origin, destination) => {
    try {
      setLoadingRoute(true);
      setMapError("");

      const routeData = await routesService.calculateRoute(origin, destination);

      setRouteDetails(routeData);

      if (
        routeData.fromJSAPI &&
        routeData.rawResult &&
        mapRef.current &&
        googleMapsRef.current
      ) {
        if (!directionsRendererRef.current) {
          directionsRendererRef.current =
            new window.google.maps.DirectionsRenderer({
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: "#4fc3f7",
                strokeWeight: 5,
              },
            });
        }

        directionsRendererRef.current.setMap(googleMapsRef.current);
        directionsRendererRef.current.setDirections(routeData.rawResult);
      } else if (
        routeData.encodedPolyline &&
        mapRef.current &&
        googleMapsRef.current
      ) {
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        if (
          !window.google ||
          !window.google.maps ||
          !window.google.maps.geometry ||
          !window.google.maps.geometry.encoding
        ) {
          console.warn("Google Maps Geometry库不可用，无法解码路线");

          const simplePath = [
            new google.maps.LatLng(origin.lat, origin.lng),
            new google.maps.LatLng(destination.lat, destination.lng),
          ];

          const routePolyline = new google.maps.Polyline({
            path: simplePath,
            strokeColor: "#4fc3f7",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          });

          routePolyline.setMap(googleMapsRef.current);

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
          bounds.extend(
            new google.maps.LatLng(destination.lat, destination.lng)
          );
          googleMapsRef.current.fitBounds(bounds);
        } else {
          const decodePath = google.maps.geometry.encoding.decodePath(
            routeData.encodedPolyline
          );

          const routePolyline = new google.maps.Polyline({
            path: decodePath,
            strokeColor: "#4fc3f7",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          });

          const bounds = new google.maps.LatLngBounds();
          decodePath.forEach((point) => bounds.extend(point));
          googleMapsRef.current.fitBounds(bounds);

          routePolyline.setMap(googleMapsRef.current);
        }

        const originMarker = new google.maps.Marker({
          position: origin,
          map: googleMapsRef.current,
          title: "Starting Point",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          },
        });

        const destinationMarker = new google.maps.Marker({
          position: destination,
          map: googleMapsRef.current,
          title: selectedDestination.name,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      setMapError("Failed to calculate route. Please try again.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const mapCenter = userLocation || { lat: -36.8508, lng: 174.7645 };

    googleMapsRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: mapCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: "5a8d875e3485586f",
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
      ],
    });

    if (userLocation && selectedDestination && selectedDestination.location) {
      calculateRoute(userLocation, selectedDestination.location);
    }
  };

  useEffect(() => {
    if (activeStep === 1) {
      getCurrentLocation();

      const googleMapsScript = document.getElementById("google-maps-script");
      if (!googleMapsScript) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        // Get API key from environment variables
        const apiKey =
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
          "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&map_ids=5a8d875e3485586f`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    }
  }, [activeStep, selectedDestination]);

  useEffect(() => {
    if (activeStep === 1 && userLocation) {
      initializeMap();
    }
  }, [userLocation]);

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
          <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
              <Typography variant="h5" gutterBottom>
                Confirm Your Destination
              </Typography>
              <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: "rgba(0,0,0,0.2)",
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MyLocationIcon sx={{ mr: 1, color: "#4fc3f7" }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Current Location
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="#bbbbbb">
                      {userLocation
                        ? `${userLocation.lat.toFixed(
                            4
                          )}, ${userLocation.lng.toFixed(4)}`
                        : "Detecting your location..."}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      {loadingLocation
                        ? "Getting precise location..."
                        : "Location services enabled"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: "rgba(0,0,0,0.2)",
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1, color: "#f44336" }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Destination
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      {selectedDestination.name}
                    </Typography>
                    <Typography variant="body2" color="#bbbbbb" gutterBottom>
                      {selectedDestination.address}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(255,255,255,0.1)",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                        }}
                      >
                        {selectedDestination.category}
                      </Box>
                    </Box>
                  </Box>

                  {userLocation && routeDetails && (
                    <Box
                      sx={{
                        mb: 3,
                        p: 2,
                        bgcolor: "rgba(0,0,0,0.2)",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        gutterBottom
                      >
                        Route Information
                      </Typography>
                      <List dense>
                        <ListItem sx={{ px: 1, py: 0.5 }}>
                          <ListItemIcon
                            sx={{ minWidth: 36, color: "primary.main" }}
                          >
                            <DirectionsIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Distance"
                            secondary={routeDetails.distance}
                            primaryTypographyProps={{
                              color: "white",
                              fontWeight: "medium",
                            }}
                            secondaryTypographyProps={{ color: "#bbbbbb" }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 1, py: 0.5 }}>
                          <ListItemIcon
                            sx={{ minWidth: 36, color: "primary.main" }}
                          >
                            <TimelapseIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Estimated Travel Time"
                            secondary={routeDetails.duration}
                            primaryTypographyProps={{
                              color: "white",
                              fontWeight: "medium",
                            }}
                            secondaryTypographyProps={{ color: "#bbbbbb" }}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  )}

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ mb: 1 }}
                    >
                      Select Your Vehicle
                    </Typography>
                    <Grid container spacing={1}>
                      {vehicles.map((vehicle) => (
                        <Grid item xs={6} key={vehicle.id}>
                          <Card
                            sx={{
                              bgcolor:
                                selectedVehicle?.id === vehicle.id
                                  ? "primary.dark"
                                  : "rgba(0,0,0,0.2)",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                              transition: "background-color 0.3s",
                              border:
                                selectedVehicle?.id === vehicle.id
                                  ? "1px solid #4fc3f7"
                                  : "1px solid rgba(255,255,255,0.1)",
                            }}
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <CardContent sx={{ p: 1.5 }}>
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
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

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={confirmDestination}
                    disabled={!selectedVehicle || loadingRoute}
                    sx={{
                      mt: 2,
                      py: 1.2,
                      fontWeight: "bold",
                      boxShadow: 3,
                    }}
                  >
                    {loadingRoute ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress
                          size={20}
                          sx={{ mr: 1 }}
                          color="inherit"
                        />
                        Calculating Route...
                      </Box>
                    ) : (
                      "CONFIRM AND START NAVIGATION"
                    )}
                  </Button>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Paper
                    sx={{
                      height: "380px",
                      width: "100%",
                      bgcolor: "#2a2a2a",
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 1,
                      mb: 2,
                      boxShadow: 3,
                    }}
                  >
                    {mapError && (
                      <Alert
                        severity="error"
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          right: 10,
                          zIndex: 10,
                        }}
                      >
                        {mapError}
                      </Alert>
                    )}

                    {(loadingLocation || !userLocation) && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          backgroundColor: "rgba(0,0,0,0.7)",
                          zIndex: 5,
                        }}
                      >
                        <CircularProgress color="primary" size={40} />
                        <Typography
                          variant="body2"
                          sx={{ mt: 2, color: "white" }}
                        >
                          Getting your location...
                        </Typography>
                      </Box>
                    )}

                    <Box
                      ref={mapRef}
                      sx={{
                        height: "100%",
                        width: "100%",
                        opacity: loadingRoute ? 0.6 : 1,
                        transition: "opacity 0.3s",
                      }}
                    />

                    {loadingRoute && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0,0,0,0.5)",
                          zIndex: 5,
                        }}
                      >
                        <CircularProgress color="primary" />
                      </Box>
                    )}

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        bgcolor: "rgba(0,0,0,0.7)",
                        borderRadius: 1,
                        p: 1,
                        zIndex: 4,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: "#4CAF50",
                            mr: 1,
                          }}
                        />
                        <Typography variant="caption" color="white">
                          Current Location
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: "#F44336",
                            mr: 1,
                          }}
                        />
                        <Typography variant="caption" color="white">
                          Destination
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Paper
                    sx={{
                      bgcolor: "#2a2a2a",
                      p: 2,
                      borderRadius: 1,
                      height: "210px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Turn-by-Turn Directions
                    </Typography>

                    {!routeDetails || !routeDetails.steps ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {loadingRoute
                            ? "Calculating directions..."
                            : "No directions available"}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ overflow: "auto", flex: 1 }}>
                          <List dense sx={{ p: 0 }}>
                            {routeDetails.steps
                              .slice(0, 5)
                              .map((step, index) => (
                                <ListItem
                                  key={index}
                                  divider={
                                    index <
                                    Math.min(routeDetails.steps.length, 5) - 1
                                  }
                                  sx={{ py: 1 }}
                                >
                                  <ListItemIcon
                                    sx={{ minWidth: 36, color: "primary.main" }}
                                  >
                                    <NavigationIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`Step ${index + 1}`}
                                    secondary={
                                      <Box>
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: step.instructions,
                                          }}
                                        />
                                        {step.distance && (
                                          <Typography
                                            variant="caption"
                                            component="div"
                                            sx={{ mt: 0.5, color: "#9e9e9e" }}
                                          >
                                            {step.distance} •{" "}
                                            {step.duration || ""}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                    primaryTypographyProps={{
                                      color: "white",
                                      variant: "body2",
                                      fontWeight: "medium",
                                    }}
                                    secondaryTypographyProps={{
                                      color: "#bbbbbb",
                                      variant: "caption",
                                    }}
                                  />
                                </ListItem>
                              ))}

                            {routeDetails.steps.length < 5 &&
                              Array.from({
                                length: 5 - routeDetails.steps.length,
                              }).map((_, index) => (
                                <ListItem
                                  key={`empty-${index}`}
                                  divider={
                                    index < 5 - routeDetails.steps.length - 1
                                  }
                                  sx={{ py: 1.5 }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 36,
                                      color: "rgba(255,255,255,0.2)",
                                    }}
                                  >
                                    <NavigationIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary="End of route"
                                    primaryTypographyProps={{
                                      color: "rgba(255,255,255,0.3)",
                                      variant: "body2",
                                      fontStyle: "italic",
                                    }}
                                  />
                                </ListItem>
                              ))}
                          </List>
                        </Box>
                        {routeDetails.steps.length > 5 && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: "center",
                              mt: 1,
                              color: "#bbbbbb",
                              borderTop: "1px solid rgba(255,255,255,0.1)",
                              pt: 1,
                            }}
                          >
                            + {routeDetails.steps.length - 5} more steps to
                            destination
                          </Typography>
                        )}
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
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

              <NavigationMap
                origin={userLocation || { lat: -36.8508, lng: 174.7645 }}
                destination={selectedDestination.location}
                navigationProgress={navigationProgress}
              />

              <Box sx={{ mb: 2, mt: 2 }}>
                <Typography variant="subtitle1">Navigation Info</Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  From: Your Location
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  To: {selectedDestination.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  Distance:{" "}
                  {routeDetails?.distance ||
                    `${Math.floor(Math.random() * 5) + 2} km`}
                </Typography>
                <Typography variant="body2" sx={{ color: "#bbbbbb" }}>
                  Estimated Time:{" "}
                  {routeDetails?.duration ||
                    `${Math.floor(Math.random() * 15) + 5} min`}
                </Typography>
              </Box>

              <Box
                sx={{
                  mb: 2,
                  mt: 3,
                  p: 1,
                  bgcolor: "rgba(0,0,0,0.2)",
                  borderRadius: 1,
                  position: "relative",
                  overflow: "hidden",
                  height: "24px",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${navigationProgress}%`,
                    bgcolor: "primary.main",
                    transition: "width 0.3s ease-in-out",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    zIndex: 1,
                  }}
                >
                  DRIVING ({navigationProgress}%)
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
                  ? `Please Wait...`
                  : "ARRIVED AT PARKING LOT"}
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

// NavigationMap组件用于显示导航地图和动态移动的标记
function NavigationMap({ origin, destination, navigationProgress }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const routePolylineRef = useRef(null);
  const markerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const routePathRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);

  // 初始化地图
  const initMap = async () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.warn("Cannot initialize map: Google Maps not loaded");
      setError("Cannot load map. Please check your network connection.");
      return;
    }

    try {
      // 创建地图实例
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: origin,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: "5a8d875e3485586f",
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#242f3e" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#242f3e" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#746855" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
        ],
      });

      // 计算并显示路线
      await calculateAndDisplayRoute(origin, destination);
    } catch (error) {
      console.error("Map initialization error:", error);
      setError("Failed to load map. Please refresh the page.");
    }
  };

  // 计算和显示路线
  const calculateAndDisplayRoute = async (origin, destination) => {
    if (!googleMapRef.current) return;

    setLoading(true);

    try {
      // 使用routesService计算路线
      const routeResult = await routesService.calculateRoute(
        origin,
        destination
      );
      setRouteDetails(routeResult);

      // 检查是否有编码的多段线路径
      if (routeResult.encodedPolyline) {
        // 使用Google Maps geometry库来解码多段线
        if (
          window.google.maps.geometry &&
          window.google.maps.geometry.encoding
        ) {
          const path = google.maps.geometry.encoding.decodePath(
            routeResult.encodedPolyline
          );
          routePathRef.current = path;

          // 创建路线线条
          if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
          }

          routePolylineRef.current = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: "#4fc3f7",
            strokeOpacity: 1.0,
            strokeWeight: 4,
          });

          routePolylineRef.current.setMap(googleMapRef.current);

          // 设置地图边界以显示整个路线
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend(destination);
          path.forEach((point) => bounds.extend(point));
          googleMapRef.current.fitBounds(bounds);

          // 创建起点和终点标记
          addFixedMarkers(origin, destination);

          // 创建会移动的红点标记
          createMovingMarker(path[0]);

          setLoading(false);
        } else {
          console.warn(
            "Google Maps Geometry library not available for polyline decoding"
          );
          createStaticRoutePath(origin, destination);
          setLoading(false);
        }
      } else if (routeResult.fromJSAPI && routeResult.rawResult) {
        // 处理从JavaScript API返回的结果
        const route = routeResult.rawResult.routes[0];
        const path = route.overview_path;
        routePathRef.current = path;

        // 创建路线线条
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }

        routePolylineRef.current = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: "#4fc3f7",
          strokeOpacity: 1.0,
          strokeWeight: 4,
        });

        routePolylineRef.current.setMap(googleMapRef.current);

        // 设置地图边界以显示整个路线
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        path.forEach((point) => bounds.extend(point));
        googleMapRef.current.fitBounds(bounds);

        // 创建起点和终点标记
        addFixedMarkers(origin, destination);

        // 创建会移动的红点标记
        createMovingMarker(path[0]);

        setLoading(false);
      } else {
        // 如果没有路线数据，使用静态路径
        console.warn("No route data available, using static path");
        createStaticRoutePath(origin, destination);
        setLoading(false);
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      createStaticRoutePath(origin, destination);
      setLoading(false);
    }
  };

  // 创建静态路径（如果API不可用）
  const createStaticRoutePath = (origin, destination) => {
    try {
      // 创建一条简单的直线作为路径
      const simplePath = [
        new window.google.maps.LatLng(origin.lat, origin.lng),
        new window.google.maps.LatLng(destination.lat, destination.lng),
      ];

      routePathRef.current = simplePath;

      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }

      routePolylineRef.current = new window.google.maps.Polyline({
        path: simplePath,
        geodesic: true,
        strokeColor: "#4fc3f7",
        strokeOpacity: 1.0,
        strokeWeight: 4,
      });

      routePolylineRef.current.setMap(googleMapRef.current);

      // 设置地图边界
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      googleMapRef.current.fitBounds(bounds);

      // 添加固定标记
      addFixedMarkers(origin, destination);

      // 创建会移动的红点标记
      createMovingMarker(simplePath[0]);
    } catch (error) {
      console.error("创建静态路线错误:", error);
      setError("无法显示导航路线。请刷新页面重试。");
    }
  };

  // 添加固定的起点和终点标记
  const addFixedMarkers = (origin, destination) => {
    // 添加起点标记
    new window.google.maps.Marker({
      position: origin,
      map: googleMapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#4CAF50",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      },
      zIndex: 1,
    });

    // 添加终点标记
    new window.google.maps.Marker({
      position: destination,
      map: googleMapRef.current,
      label: {
        text: "D",
        color: "#FFFFFF",
        fontWeight: "bold",
      },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#F44336",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      },
      zIndex: 1,
    });
  };

  // 创建移动的车辆标记
  const createMovingMarker = (initialPosition) => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 创建红点标记
    markerRef.current = new window.google.maps.Marker({
      position: initialPosition,
      map: googleMapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "#FF4136",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      },
      zIndex: 2,
      // 添加脉冲效果
      animation: window.google.maps.Animation.BOUNCE,
    });

    // 停止动画效果，避免持续跳动
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.setAnimation(null);
      }
    }, 2000);
  };

  // 计算两点之间的角度
  const calculateHeading = (point1, point2) => {
    return window.google.maps.geometry.spherical.computeHeading(
      new window.google.maps.LatLng(point1.lat(), point1.lng()),
      new window.google.maps.LatLng(point2.lat(), point2.lng())
    );
  };

  // 动画移动车辆标记
  const startCarAnimation = () => {
    const path = routePathRef.current;
    if (!path || path.length < 2 || !markerRef.current) return;

    // 清除之前的动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 计算当前应该移动到的位置
    const progress = navigationProgress / 100; // 0到1之间
    const totalPathLength = path.length - 1;

    const animate = () => {
      // 计算当前位置
      const currentProgress = navigationProgress / 100;

      if (currentProgress >= 1) {
        // 已到达终点
        if (markerRef.current) {
          markerRef.current.setPosition(path[path.length - 1]);
        }
        return;
      }

      // 计算当前应该在路径的哪个部分
      const pathIndex = Math.min(
        Math.floor(currentProgress * totalPathLength),
        totalPathLength - 1
      );

      // 计算两点之间的位置
      const segmentProgress = currentProgress * totalPathLength - pathIndex;

      const currentPoint = path[pathIndex];
      const nextPoint = path[pathIndex + 1];

      // 计算当前位置（两点之间的插值）
      const lat =
        currentPoint.lat() +
        (nextPoint.lat() - currentPoint.lat()) * segmentProgress;
      const lng =
        currentPoint.lng() +
        (nextPoint.lng() - currentPoint.lng()) * segmentProgress;

      // 更新标记位置
      const newPosition = new window.google.maps.LatLng(lat, lng);
      markerRef.current.setPosition(newPosition);

      // 请求下一帧动画
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 启动动画
    animate();
  };

  // 初始化地图
  useEffect(() => {
    initMap();

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [origin, destination]);

  // 根据导航进度更新车辆位置
  useEffect(() => {
    if (!loading && markerRef.current) {
      startCarAnimation();
    }
  }, [navigationProgress, loading]);

  return (
    <Box
      sx={{
        position: "relative",
        height: "300px",
        bgcolor: "#333333",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 2,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 2,
            p: 2,
          }}
        >
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Box>
      )}

      <Box
        ref={mapRef}
        sx={{
          height: "100%",
          width: "100%",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
          bgcolor: "rgba(0,0,0,0.7)",
          borderRadius: 1,
          p: 1.5,
          zIndex: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
          Map Legend
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#4CAF50",
              mr: 1,
            }}
          />
          <Typography variant="caption" color="white">
            Start
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#F44336",
              mr: 1,
            }}
          />
          <Typography variant="caption" color="white">
            Destination
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#FF4136",
              border: "2px solid white",
              mr: 1,
            }}
          />
          <Typography variant="caption" color="white">
            Current Position
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

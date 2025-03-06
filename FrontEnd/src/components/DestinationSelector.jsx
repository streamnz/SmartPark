import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import ClearIcon from "@mui/icons-material/Clear";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ParkIcon from "@mui/icons-material/Park";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import HelpIcon from "@mui/icons-material/Help";
import MapIcon from "@mui/icons-material/Map";
import {
  searchPlaces,
  getPlaceDetails,
  mapPlaceTypeToCategory,
} from "../services/mapsService";

/**
 * Destination Selector Component
 */
function DestinationSelector({ destinations, onSelectDestination }) {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);

  // Debounce search
  const searchTimeout = useRef(null);

  // Get default destinations if API doesn't return any
  const getDefaultDestinations = () => {
    return [
      {
        id: "auckland_uni",
        name: "University of Auckland",
        address: "Auckland CBD, Auckland 1010",
        category: "Education",
        location: { lat: -36.8523, lng: 174.7691 },
      },
      {
        id: "auckland_hospital",
        name: "Auckland City Hospital",
        address: "2 Park Road, Grafton, Auckland 1023",
        category: "Medical",
        location: { lat: -36.8605, lng: 174.7705 },
      },
      {
        id: "sylvia_park",
        name: "Sylvia Park Shopping Centre",
        address:
          "286 Mount Wellington Highway, Mount Wellington, Auckland 1060",
        category: "Shopping",
        location: { lat: -36.9173, lng: 174.8428 },
      },
      {
        id: "yoobee_college",
        name: "Yoobee College of Creative Innovation",
        address: "Level 4/3 City Road, Grafton, Auckland 1010",
        category: "Education",
        location: { lat: -36.8577, lng: 174.7645 },
      },
    ];
  };

  // Initialize the map
  const initializeMap = () => {
    try {
      if (!mapRef.current || !window.google || !window.google.maps) {
        console.warn("Map initialization failed: Google Maps not loaded");
        setMapLoadError(true);
        return;
      }

      const aucklandCenter = { lat: -36.8508, lng: 174.7645 }; // Auckland center coordinates

      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: aucklandCenter,
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

      setMapLoaded(true);
      setMapLoadError(false);
      addPopularDestinationsToMap();
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapLoadError(true);
    }
  };

  // Get marker icon based on category
  const getCategoryMarkerIcon = (category) => {
    switch (category) {
      case "Education":
        return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
      case "Medical":
        return "http://maps.google.com/mapfiles/ms/icons/pink-dot.png";
      case "Shopping":
        return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
      case "Leisure/Dining":
        return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
      case "Parks":
        return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
      case "Tourism/Entertainment":
        return "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
      case "Transport":
        return "http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png";
      default:
        return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    }
  };

  // Add popular destinations to the map
  const addPopularDestinationsToMap = () => {
    try {
      if (!googleMapRef.current || !window.google || !window.google.maps) {
        console.warn("Cannot add markers: Map not initialized");
        return;
      }

      // Clear existing markers
      clearMarkers();

      const popularDestinations =
        destinations?.data || getDefaultDestinations();
      const bounds = new window.google.maps.LatLngBounds();

      popularDestinations.forEach((destination) => {
        if (destination.location) {
          addMarkerToMap(destination, bounds);
        }
      });

      if (markersRef.current.length > 0) {
        googleMapRef.current.fitBounds(bounds);
      }
    } catch (error) {
      console.error("Error adding destinations to map:", error);
    }
  };

  // Add a marker to the map
  const addMarkerToMap = (destination, bounds) => {
    try {
      // Check if AdvancedMarkerElement is available (new API)
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.marker &&
        window.google.maps.marker.AdvancedMarkerElement
      ) {
        // Use the new AdvancedMarkerElement API
        const position = destination.location;

        // Create marker content
        const element = document.createElement("div");
        element.innerHTML = `
          <div style="width: 24px; height: 24px; background-color: ${getCategoryColor(
            destination.category
          )}; 
                      border-radius: 50%; border: 2px solid white; cursor: pointer;"></div>
        `;

        // Create the advanced marker
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: googleMapRef.current,
          position: position,
          title: destination.name,
          content: element,
        });

        // Add click listener
        marker.addListener("click", () => {
          onSelectDestination(destination);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      } else {
        // Fallback to the deprecated Marker API
        const marker = new window.google.maps.Marker({
          position: destination.location,
          map: googleMapRef.current,
          title: destination.name,
          icon: {
            url: getCategoryMarkerIcon(destination.category),
          },
        });

        marker.addListener("click", () => {
          onSelectDestination(destination);
        });

        markersRef.current.push(marker);
        bounds.extend(destination.location);
      }
    } catch (error) {
      console.error("Error adding marker:", error);
    }
  };

  // Get color for a category (for AdvancedMarkerElement)
  const getCategoryColor = (category) => {
    switch (category) {
      case "Education":
        return "#2196F3"; // Blue
      case "Medical":
        return "#E91E63"; // Pink
      case "Shopping":
        return "#FFC107"; // Yellow
      case "Leisure/Dining":
        return "#FF9800"; // Orange
      case "Parks":
        return "#4CAF50"; // Green
      case "Tourism/Entertainment":
        return "#9C27B0"; // Purple
      case "Transport":
        return "#03A9F4"; // Light blue
      default:
        return "#F44336"; // Red
    }
  };

  // Clear all markers from the map
  const clearMarkers = () => {
    try {
      markersRef.current.forEach((marker) => {
        if (marker.setMap) {
          marker.setMap(null);
        } else if (marker.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    } catch (error) {
      console.error("Error clearing markers:", error);
    }
  };

  // Load Google Maps
  useEffect(() => {
    const loadMap = () => {
      try {
        const googleMapsScript = document.getElementById("google-maps-script");
        if (!googleMapsScript) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          const apiKey =
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
            "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
          script.async = true;
          script.defer = true;
          script.onload = initializeMap;
          script.onerror = () => {
            console.error("Failed to load Google Maps script");
            setMapLoadError(true);
          };
          document.head.appendChild(script);
        } else if (window.google && window.google.maps) {
          initializeMap();
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setMapLoadError(true);
      }
    };

    loadMap();

    // Cleanup function
    return () => {
      clearMarkers();
    };
  }, []);

  // Update map when destinations change
  useEffect(() => {
    if (mapLoaded && googleMapRef.current) {
      addPopularDestinationsToMap();
    }
  }, [destinations, mapLoaded]);

  // Debouncing search query
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.trim().length > 0) {
      setLoading(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchPlaces(searchQuery);
          setSearchResults(results);
          setError("");
        } catch (err) {
          console.error("Error searching for places:", err);
          setError("Failed to search places. Please try again later.");
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setLoading(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle place selection
  const handleSelectPlace = async (place) => {
    try {
      setLoading(true);
      setError("");

      let destination;

      try {
        // Get place details from API
        const placeDetails = await getPlaceDetails(place.place_id);

        // Create destination object
        destination = {
          id: place.place_id,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          location: {
            lat: placeDetails.geometry.location.lat(),
            lng: placeDetails.geometry.location.lng(),
          },
          category: mapPlaceTypeToCategory(placeDetails.types),
          types: placeDetails.types,
        };
      } catch (err) {
        console.error("Error fetching place details, using fallback:", err);

        // Fallback: Create a destination from the search result
        destination = {
          id: place.place_id || `manual_${Date.now()}`,
          name:
            place.structured_formatting?.main_text ||
            place.description ||
            "Selected Location",
          address: place.structured_formatting?.secondary_text || "",
          location: place.location || { lat: -36.8508, lng: 174.7645 }, // Auckland center as fallback
          category: "Other",
        };
      }

      // Set selected place
      setSelectedPlace(destination);

      // Clear search and results
      setSearchQuery("");
      setSearchResults([]);

      // Add marker to map for the selected place
      if (googleMapRef.current && mapLoaded) {
        // Clear existing markers
        clearMarkers();

        const bounds = new window.google.maps.LatLngBounds();
        addMarkerToMap(destination, bounds);

        // Center map on location
        googleMapRef.current.setCenter(destination.location);
        googleMapRef.current.setZoom(15);
      }

      // Notify parent component
      if (onSelectDestination) {
        onSelectDestination(destination);
      }
    } catch (err) {
      console.error("Error handling place selection:", err);
      setError("Could not get place details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a default destination
  const handleSelectDefaultDestination = (destination) => {
    // Set selected place
    setSelectedPlace(destination);

    // Add marker to map for the selected place
    if (googleMapRef.current && mapLoaded) {
      // Clear existing markers
      clearMarkers();

      const bounds = new window.google.maps.LatLngBounds();
      addMarkerToMap(destination, bounds);

      // Center map on location
      googleMapRef.current.setCenter(destination.location);
      googleMapRef.current.setZoom(15);
    }

    // Notify parent component
    if (onSelectDestination) {
      onSelectDestination(destination);
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Education":
        return <SchoolIcon />;
      case "Medical":
        return <LocalHospitalIcon />;
      case "Shopping":
        return <ShoppingCartIcon />;
      case "Leisure/Dining":
        return <RestaurantIcon />;
      case "Parks":
        return <ParkIcon />;
      case "Tourism/Entertainment":
        return <LocalActivityIcon />;
      case "Transport":
        return <DirectionsBusIcon />;
      default:
        return <HelpIcon />;
    }
  };

  // Render popular destinations
  const renderPopularDestinations = () => {
    // Use default preset destinations or API returned destinations
    const popularDestinations = destinations?.data || getDefaultDestinations();

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          Popular Destinations in Auckland
        </Typography>
        <Grid container spacing={2}>
          {popularDestinations.map((destination) => (
            <Grid item xs={12} key={destination.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": { transform: "scale(1.01)" },
                  bgcolor: "rgba(0,0,0,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onClick={() => handleSelectDefaultDestination(destination)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                      {getCategoryIcon(destination.category)}
                    </ListItemIcon>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      fontWeight="medium"
                    >
                      {destination.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="#bbbbbb" sx={{ ml: 5 }}>
                    {destination.address}
                  </Typography>
                  <Box
                    sx={{ display: "flex", alignItems: "center", mt: 1, ml: 5 }}
                  >
                    <Box
                      sx={{
                        bgcolor: "rgba(255,255,255,0.1)",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                      }}
                    >
                      {destination.category}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: "#1e1e1e", color: "white" }}>
        <Typography variant="h5" gutterBottom>
          Select Your Destination
        </Typography>
        <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.1)" }} />

        <Grid container spacing={3}>
          {/* Left Side - Search & Destinations List */}
          <Grid item xs={12} md={5}>
            {/* Search Box */}
            <Box
              sx={{ mb: 3, p: 2, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 1 }}
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Search for a Destination
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter destination name or address"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {loading ? (
                        <CircularProgress size={20} />
                      ) : searchQuery ? (
                        <IconButton
                          size="small"
                          onClick={handleClearSearch}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      ) : null}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#1e1e1e",
                    borderRadius: 2,
                    color: "white",
                  },
                }}
              />

              {/* Error message */}
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Paper
                sx={{
                  mt: 2,
                  mb: 3,
                  maxHeight: 300,
                  overflow: "auto",
                  bgcolor: "rgba(0,0,0,0.2)",
                  color: "white",
                  borderRadius: 1,
                }}
                elevation={0}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ p: 2, pb: 1 }}
                >
                  Search Results
                </Typography>
                <List dense>
                  {searchResults.map((result) => (
                    <ListItem
                      key={result.place_id || result.description}
                      onClick={() => handleSelectPlace(result)}
                      sx={{
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                        px: 2,
                        cursor: "pointer",
                      }}
                    >
                      <ListItemIcon
                        sx={{ minWidth: 36, color: "primary.main" }}
                      >
                        <PlaceIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          result.structured_formatting?.main_text ||
                          result.description
                        }
                        secondary={
                          result.structured_formatting?.secondary_text || ""
                        }
                        primaryTypographyProps={{ color: "white" }}
                        secondaryTypographyProps={{ color: "gray" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Popular Destinations */}
            {!loading &&
              searchResults.length === 0 &&
              renderPopularDestinations()}
          </Grid>

          {/* Right Side - Map */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                height: "550px",
                width: "100%",
                bgcolor: "#2a2a2a",
                position: "relative",
                overflow: "hidden",
                borderRadius: 1,
                boxShadow: 3,
              }}
            >
              {mapLoadError && (
                <Alert
                  severity="warning"
                  sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    right: 10,
                    zIndex: 10,
                    backgroundColor: "rgba(237, 108, 2, 0.8)",
                    color: "white",
                  }}
                >
                  Map could not be loaded. You can still select a destination
                  from the list.
                </Alert>
              )}

              {!mapLoaded && !mapLoadError && (
                <Box
                  sx={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading map...
                  </Typography>
                </Box>
              )}

              <Box
                ref={mapRef}
                sx={{
                  height: "100%",
                  width: "100%",
                  opacity: mapLoadError ? 0.3 : 1,
                }}
              />

              {/* Map Legend */}
              {mapLoaded && !mapLoadError && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    bgcolor: "rgba(0,0,0,0.7)",
                    borderRadius: 1,
                    p: 1.5,
                    zIndex: 4,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 1 }}
                  >
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
                      Parks
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#2196F3",
                        mr: 1,
                      }}
                    />
                    <Typography variant="caption" color="white">
                      Education
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "#FF9800",
                        mr: 1,
                      }}
                    />
                    <Typography variant="caption" color="white">
                      Shopping
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
                      Selected
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default DestinationSelector;

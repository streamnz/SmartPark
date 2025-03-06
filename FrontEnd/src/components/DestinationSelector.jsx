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
  CardMedia,
  CardContent,
  Skeleton,
  Divider,
  CircularProgress,
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

  // Debounce search
  const searchTimeout = useRef(null);

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

      // Get place details
      const placeDetails = await getPlaceDetails(place.place_id);

      // Create destination object
      const destination = {
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

      // Set selected place
      setSelectedPlace(destination);

      // Clear search and results
      setSearchQuery("");
      setSearchResults([]);

      // Notify parent component
      if (onSelectDestination) {
        onSelectDestination(destination);
      }
    } catch (err) {
      console.error("Error getting place details:", err);
      setError("Could not get place details. Please try again.");
    } finally {
      setLoading(false);
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
    const popularDestinations = destinations?.data || [
      {
        id: "auckland_uni",
        name: "University of Auckland",
        address: "Auckland CBD, Auckland 1010",
        category: "Education",
      },
      {
        id: "auckland_hospital",
        name: "Auckland City Hospital",
        address: "2 Park Road, Grafton, Auckland 1023",
        category: "Medical",
      },
      {
        id: "sylvia_park",
        name: "Sylvia Park Shopping Centre",
        address:
          "286 Mount Wellington Highway, Mount Wellington, Auckland 1060",
        category: "Shopping",
      },
    ];

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Popular Destinations in Auckland
        </Typography>
        <Grid container spacing={2}>
          {popularDestinations.map((destination) => (
            <Grid item xs={12} sm={6} md={4} key={destination.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": { transform: "scale(1.02)" },
                  bgcolor: "#1e1e1e",
                  color: "white",
                }}
                onClick={() => onSelectDestination(destination)}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                      {getCategoryIcon(destination.category)}
                    </ListItemIcon>
                    <Typography variant="subtitle1" component="div">
                      {destination.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {destination.address}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 1, color: "grey.500" }}
                  >
                    {destination.category}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ px: 3, py: 2, maxWidth: "800px", mx: "auto" }}>
      <Typography variant="subtitle1" gutterBottom textAlign="center">
        Search for Destinations
      </Typography>

      {/* Search box */}
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
                <IconButton size="small" onClick={handleClearSearch} edge="end">
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

      {/* Search results */}
      {searchResults.length > 0 && (
        <Paper
          sx={{
            mt: 1,
            maxHeight: 300,
            overflow: "auto",
            bgcolor: "#1e1e1e",
            color: "white",
          }}
          elevation={3}
        >
          <List dense>
            {searchResults.map((result) => (
              <ListItem
                key={result.place_id}
                button
                onClick={() => handleSelectPlace(result)}
                sx={{ "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" } }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                  <PlaceIcon />
                </ListItemIcon>
                <ListItemText
                  primary={result.structured_formatting.main_text}
                  secondary={result.structured_formatting.secondary_text}
                  primaryTypographyProps={{ color: "white" }}
                  secondaryTypographyProps={{ color: "gray" }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Popular destinations */}
      {!loading && searchResults.length === 0 && renderPopularDestinations()}
    </Box>
  );
}

export default DestinationSelector;

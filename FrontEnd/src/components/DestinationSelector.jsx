import React, { useState, useEffect } from "react";
import {
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Paper,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FmdGoodIcon from "@mui/icons-material/FmdGood";
import SchoolIcon from "@mui/icons-material/School";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import StoreIcon from "@mui/icons-material/Store";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ParkIcon from "@mui/icons-material/Park";
import AttractionsIcon from "@mui/icons-material/Attractions";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import RefreshIcon from "@mui/icons-material/Refresh";
import { api } from "../services/api";
// Import mapsService directly to use searchPlaces function
import mapsService from "../services/mapsService";

// Keep only search and results list functionality
function DestinationSelector({ onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Load Google Maps API on component mount
  useEffect(() => {
    loadMapsApi();
  }, []);

  // Load popular destinations
  useEffect(() => {
    async function loadPopularDestinations() {
      try {
        const response = await api.getDestinations();
        if (response && response.data) {
          setPopularDestinations(response.data);
        }
      } catch (err) {
        console.error("Error loading popular destinations", err);
        setError("Failed to load popular destinations");
      }
    }

    loadPopularDestinations();
  }, []);

  // Load Google Maps API
  const loadMapsApi = async () => {
    try {
      setApiLoading(true);
      setApiError(false);
      await mapsService.ensureApiLoaded();
      setApiLoading(false);
    } catch (err) {
      console.error("Failed to load Maps API:", err);
      setApiLoading(false);
      setApiError(true);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.trim() === "") {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First check if API is loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        // Try to load API again
        try {
          await mapsService.ensureApiLoaded();
        } catch (err) {
          throw new Error("Maps API not available");
        }
      }

      const results = await mapsService.searchPlaces(query);
      setSearchResults(results || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Maps API may not be loaded.");
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Education":
        return <SchoolIcon />;
      case "Medical":
        return <LocalHospitalIcon />;
      case "Shopping":
        return <StoreIcon />;
      case "Leisure/Dining":
        return <RestaurantIcon />;
      case "Parks":
        return <ParkIcon />;
      case "Tourism/Entertainment":
        return <AttractionsIcon />;
      case "Transport":
        return <DirectionsTransitIcon />;
      default:
        return <LocationOnIcon />;
    }
  };

  const handleSelectDestination = async (item) => {
    console.log("选择目的地:", item);

    try {
      // 如果是从搜索结果中选择的地点（有place_id但没有完整location）
      if (
        item.id &&
        (!item.location || !item.location.lat || !item.location.lng)
      ) {
        console.log("从Places API获取地点详情...");
        setLoading(true);

        // 确保Maps API已加载
        await mapsService.ensureApiLoaded();

        // 获取地点详情（包括经纬度）
        const placeDetails = await mapsService.getPlaceDetails(item.id);
        console.log("获取到地点详情:", placeDetails);

        if (placeDetails && placeDetails.location) {
          // 使用获取到的详细信息创建完整的目的地对象
          const completeDestination = {
            ...item,
            name: placeDetails.name || item.name,
            address: placeDetails.address || item.address,
            location: {
              lat: placeDetails.location.lat,
              lng: placeDetails.location.lng,
            },
            category: placeDetails.category || item.category,
          };

          console.log("传递完整目的地对象:", completeDestination);
          onSelect(completeDestination);
        } else {
          console.error("无法获取地点详情或经纬度信息");
          // 显示错误消息
          setError("无法获取该地点的位置信息，请选择其他地点");
        }
      } else if (item.location && item.location.lat && item.location.lng) {
        // 如果已经有完整的location信息（如从推荐列表选择）
        console.log("目的地已包含位置信息，直接使用");
        onSelect(item);
      } else {
        console.error("选择的目的地缺少必要信息:", item);
        setError("无法使用该地点，请选择其他地点");
        return;
      }
    } catch (error) {
      console.error("处理目的地选择时出错:", error);
      setError(`获取地点详情失败: ${error.message}`);
    } finally {
      setLoading(false);
      // 清空搜索字段
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Show API loading/error message
  if (apiLoading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading Maps API...
        </Typography>
      </Box>
    );
  }

  if (apiError) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadMapsApi}
          >
            Retry
          </Button>
        }
      >
        Google Maps API failed to load. This is required for searching places.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search for a destination"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null,
            sx: {
              bgcolor: "rgba(255,255,255,0.09)",
              borderRadius: 1,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.2)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.3)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#1A73E8",
              },
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {searchQuery && searchResults.length > 0 ? (
        <List dense sx={{ mb: 1, maxHeight: 200, overflow: "auto" }}>
          {searchResults.map((result) => (
            <ListItem
              key={result.place_id}
              onClick={() =>
                handleSelectDestination({
                  id: result.place_id,
                  name: result.structured_formatting
                    ? result.structured_formatting.main_text
                    : result.description,
                  address: result.structured_formatting
                    ? result.structured_formatting.secondary_text
                    : "",
                  location: { lat: 0, lng: 0 }, // This will be updated with actual coordinates when selected
                })
              }
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                cursor: "pointer",
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LocationOnIcon color="error" />
              </ListItemIcon>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2" noWrap>
                    {result.structured_formatting
                      ? result.structured_formatting.main_text
                      : result.description}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ color: "rgba(255,255,255,0.6)" }}
                    noWrap
                  >
                    {result.structured_formatting
                      ? result.structured_formatting.secondary_text
                      : ""}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : searchQuery && searchResults.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No results found
        </Typography>
      ) : (
        <Box>
          <Typography
            variant="body2"
            gutterBottom
            sx={{ fontWeight: 500, mb: 1 }}
          >
            Popular Destinations in Auckland
          </Typography>
          <List dense sx={{ maxHeight: 220, overflow: "auto" }}>
            {popularDestinations.map((destination) => (
              <ListItem
                key={destination.id}
                onClick={() => handleSelectDestination(destination)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  cursor: "pointer",
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getCategoryIcon(destination.category)}
                </ListItemIcon>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="body2" noWrap>
                      {destination.name}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                        noWrap
                      >
                        {destination.address}
                      </Typography>
                      {destination.category && (
                        <Box component="div" sx={{ mt: 0.5 }}>
                          <Chip
                            label={destination.category}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.6rem",
                            }}
                          />
                        </Box>
                      )}
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default DestinationSelector;

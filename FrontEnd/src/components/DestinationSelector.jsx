import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SchoolIcon from "@mui/icons-material/School";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ParkIcon from "@mui/icons-material/Park";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CasinoIcon from "@mui/icons-material/Casino";
import { api } from "../services/api";

const DestinationSelector = ({
  destinations = { data: [] },
  onSelectDestination,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [processedDestinations, setProcessedDestinations] = useState([]);

  useEffect(() => {
    // Ensure destinations exists and has data property
    if (destinations && destinations.data) {
      setProcessedDestinations(destinations.data);
    } else {
      setProcessedDestinations([]);
    }
  }, [destinations]);

  // Get icon for destination category
  const getCategoryIcon = (category) => {
    // Special treatment for Education category
    if (category === "Education") {
      return <SchoolIcon sx={{ color: "#ffffff", fontSize: 30 }} />;
    }

    const categoryMap = {
      Medical: <LocalHospitalIcon color="error" />,
      Shopping: <ShoppingCartIcon color="success" />,
      "Leisure/Dining": <RestaurantIcon color="warning" />,
      "Leisure/Family": <RestaurantIcon color="warning" />,
      Parks: <ParkIcon color="success" />,
      "Parks/Attractions": <ParkIcon color="success" />,
      "Beach/Leisure": <BeachAccessIcon color="info" />,
      "Tourism/Entertainment": <CasinoIcon color="secondary" />,
      Transport: <LocationOnIcon color="primary" />,
    };

    return categoryMap[category] || <LocationOnIcon color="primary" />;
  };

  // Get background color for Avatar
  const getAvatarBgColor = (category) => {
    // Provide deeper blue for Education category
    if (category === "Education") {
      return "#1565c0"; // Deeper blue
    }
    return "primary.main"; // Default for other categories
  };

  // Filter for search
  const filteredDestinations = processedDestinations.filter(
    (destination) =>
      destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (destination.address &&
        destination.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Select Your Destination
      </Typography>
      <Typography variant="body1" gutterBottom align="center" sx={{ mb: 2 }}>
        Choose where you want to go in Auckland
      </Typography>

      <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
        <TextField
          label="Search destinations"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "100%", maxWidth: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredDestinations.map((destination) => (
          <Grid item xs={12} sm={6} md={4} key={destination.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.02)",
                },
                bgcolor: "#333333",
                color: "white",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "center",
                  bgcolor: "#333333",
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: getAvatarBgColor(destination.category),
                  }}
                >
                  {getCategoryIcon(destination.category)}
                </Avatar>
              </Box>

              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ mb: 1, textAlign: "center", fontWeight: 500 }}
                >
                  {destination.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, textAlign: "center", color: "#aaaaaa" }}
                >
                  {destination.address}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <Chip
                    label={destination.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ bgcolor: "transparent" }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  paragraph
                  sx={{ textAlign: "center", mb: 2, color: "#cccccc" }}
                >
                  {destination.description}
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => onSelectDestination(destination)}
                  sx={{
                    bgcolor: "#2196f3",
                    fontWeight: "bold",
                    "&:hover": {
                      bgcolor: "#1976d2",
                    },
                  }}
                >
                  Go Here
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DestinationSelector;

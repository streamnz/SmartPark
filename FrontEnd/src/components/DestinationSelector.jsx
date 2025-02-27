import React, { useState } from "react";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
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

const DestinationSelector = ({ destinations, onSelectDestination }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // 获取目的地类别的图标
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case "education":
        return <SchoolIcon color="primary" />;
      case "medical":
        return <LocalHospitalIcon color="error" />;
      case "shopping":
        return <ShoppingCartIcon color="success" />;
      case "leisure/dining":
      case "leisure/family":
        return <RestaurantIcon color="warning" />;
      case "parks":
      case "parks/attractions":
        return <ParkIcon color="success" />;
      case "beach/leisure":
        return <BeachAccessIcon color="info" />;
      case "tourism/entertainment":
        return <CasinoIcon color="secondary" />;
      default:
        return <LocationOnIcon color="primary" />;
    }
  };

  // 搜索过滤
  const filteredDestinations = destinations.filter(
    (destination) =>
      destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      destination.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Choose Your Destination
      </Typography>
      <Typography variant="body1" gutterBottom align="center" sx={{ mb: 2 }}>
        Select where you want to go in Auckland City
      </Typography>

      <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
        <TextField
          label="Search Destinations"
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
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={
                  destination.image ||
                  `/maps/destinations/${destination.id}.jpg`
                }
                alt={destination.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  {getCategoryIcon(destination.category)}
                  <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                    {destination.name}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {destination.address}
                </Typography>

                <Chip
                  label={destination.category}
                  size="small"
                  sx={{ mb: 2 }}
                  color="primary"
                  variant="outlined"
                />

                <Typography variant="body2" paragraph>
                  {destination.description}
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => onSelectDestination(destination)}
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

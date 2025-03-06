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

const DestinationSelector = ({ destinations = [], onSelectDestination }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [processedDestinations, setProcessedDestinations] = useState([]);

  useEffect(() => {
    // 确保 destinations 存在且有 data 属性
    if (destinations && destinations.data) {
      setProcessedDestinations(destinations.data);
    } else {
      setProcessedDestinations([]);
    }
  }, [destinations]);

  // 获取目的地类别的图标
  const getCategoryIcon = (category) => {
    // 只修改Education类别的图标和颜色
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
    };

    return categoryMap[category] || <LocationOnIcon color="primary" />;
  };

  // 获取Avatar的背景色
  const getAvatarBgColor = (category) => {
    // 为Education类别提供更鲜明的背景色
    if (category === "Education") {
      return "#1565c0"; // 更深的蓝色
    }
    return "primary.main"; // 其他类别使用默认值
  };

  // 搜索过滤
  const filteredDestinations = processedDestinations.filter(
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
                  GO HERE
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

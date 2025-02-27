import React from "react";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AirportShuttleIcon from "@mui/icons-material/AirportShuttle";

const VehicleSelector = ({ vehicles, onSelectVehicle }) => {
  // 获取车辆类型的图标
  const getVehicleIcon = (type) => {
    switch (type) {
      case "sedan":
      case "suv":
        return <DirectionsCarIcon />;
      case "pickup":
      case "truck":
        return <LocalShippingIcon />;
      case "van":
      case "rv":
        return <AirportShuttleIcon />;
      default:
        return <DirectionsCarIcon />;
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Select Your Vehicle
      </Typography>
      <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
        Different vehicle types have different parking needs and restrictions
      </Typography>

      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
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
                image={vehicle.image || `/vehicles/${vehicle.id}.jpg`}
                alt={vehicle.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  {getVehicleIcon(vehicle.id)}
                  <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                    {vehicle.name}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {vehicle.description}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Chip
                    label={`Width ${vehicle.width}m`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`Length ${vehicle.length}m`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    label={`Height ${vehicle.height}m`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => onSelectVehicle(vehicle)}
                >
                  Select
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VehicleSelector;

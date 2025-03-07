import React from "react";
import { Box, Typography } from "@mui/material";

// Map Legend组件
const MapLegend = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        bgcolor: "rgba(0,0,0,0.7)",
        borderRadius: 1,
        p: 1.5,
        zIndex: 4,
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ mb: 1, color: "white" }}
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
  );
};

export default MapLegend;

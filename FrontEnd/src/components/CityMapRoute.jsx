// FrontEnd/src/components/CityMapRoute.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { api } from "../services/api";

// 路线动画时间(毫秒)
const ROUTE_ANIMATION_DURATION = 8000;

const CityMapRoute = ({
  startLocation,
  destination,
  vehicle,
  onArriveParking,
}) => {
  const [loading, setLoading] = useState(true);
  const [nearbyParkings, setNearbyParkings] = useState([]);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [selectedParking, setSelectedParking] = useState(null);
  const animationRef = useRef(null);
  const mapRef = useRef(null);

  // 获取附近停车场
  useEffect(() => {
    setLoading(true);

    api
      .getNearbyParkings(destination)
      .then((parkings) => {
        setNearbyParkings(parkings);
        setLoading(false);
        // 自动选择最近的停车场
        if (parkings.length > 0) {
          setSelectedParking(parkings[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching nearby parkings:", error);
        setLoading(false);
      });
  }, [destination]);

  // 初始化地图(使用AMap或Google Maps, 这里为简化实现)
  useEffect(() => {
    if (!loading && selectedParking) {
      // 模拟地图初始化和路线绘制
      console.log(
        "Initializing map and drawing route to:",
        selectedParking.name
      );

      // 开始路线动画
      let startTime = null;

      const animateRoute = (timestamp) => {
        if (!startTime) startTime = timestamp;

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / ROUTE_ANIMATION_DURATION, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateRoute);
        }
      };

      animationRef.current = requestAnimationFrame(animateRoute);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, selectedParking]);

  // 当到达停车场时的处理
  const handleArriveParking = () => {
    if (selectedParking && animationProgress >= 1) {
      onArriveParking(selectedParking);
    }
  };

  // 渲染静态地图图像
  const renderStaticMap = () => {
    if (!destination) return null;

    // 这里使用了静态的地图背景图像，在实际应用中可以用谷歌地图或高德地图API
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 400,
          backgroundImage: `url(/maps/auckland_map.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        {/* 起点标记 */}
        <Box
          sx={{
            position: "absolute",
            left: "30%",
            top: "60%",
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            bgcolor: "primary.main",
            border: "3px solid white",
            boxShadow: 3,
            zIndex: 2,
          }}
        />

        {/* 目的地标记 */}
        <Box
          sx={{
            position: "absolute",
            left: `${50 + (destination.location.lng - 174.763) * 1000}%`,
            top: `${50 + (destination.location.lat - -36.848) * 1000}%`,
            transform: "translate(-50%, -50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            bgcolor: "secondary.main",
            border: "3px solid white",
            boxShadow: 3,
            zIndex: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="white" fontWeight="bold">
            D
          </Typography>
        </Box>

        {/* 停车场标记 */}
        {selectedParking && (
          <Box
            sx={{
              position: "absolute",
              left: `${50 + (selectedParking.location.lng - 174.763) * 1000}%`,
              top: `${40 + (selectedParking.location.lat - -36.848) * 1000}%`,
              transform: "translate(-50%, -50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "success.main",
              border: "3px solid white",
              boxShadow: 3,
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="white" fontWeight="bold">
              P
            </Typography>
          </Box>
        )}

        {/* 路线动画 */}
        {selectedParking && (
          <Box
            sx={{
              position: "absolute",
              left: "30%",
              top: "60%",
              width: "40%",
              height: "2px",
              bgcolor: "primary.main",
              transformOrigin: "left center",
              transform: `scaleX(${animationProgress})`,
              zIndex: 1,
            }}
          />
        )}

        {/* 车辆标记(随路线移动) */}
        {selectedParking && (
          <Box
            sx={{
              position: "absolute",
              left: `calc(30% + ${animationProgress * 40}%)`,
              top: "60%",
              transform: "translate(-50%, -50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "background.paper",
              border: "2px solid primary.main",
              boxShadow: 2,
              zIndex: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transition: "left 0.5s ease",
            }}
          >
            <Typography variant="caption" fontWeight="bold">
              🚗
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        Driving to Destination
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>{renderStaticMap()}</Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Paper
              elevation={2}
              sx={{ p: 2, mb: 3, width: "100%", maxWidth: 600 }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Route Information
              </Typography>
              <Typography variant="body2">
                From: Auckland City Center
              </Typography>
              <Typography variant="body2">To: {destination.name}</Typography>
              <Typography variant="body2">
                Distance: {Math.floor(Math.random() * 5) + 2} km
              </Typography>
              <Typography variant="body2">
                Estimated Time: {Math.floor(Math.random() * 15) + 5} min
              </Typography>

              {selectedParking && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Recommended Parking: {selectedParking.name}
                  </Typography>
                  <Typography variant="body2">
                    Available Spots: {selectedParking.available_spots}/
                    {selectedParking.total_spots}
                  </Typography>
                  <Typography variant="body2">
                    Hourly Rate: ${selectedParking.hourly_rate}
                  </Typography>
                  <Typography variant="body2">
                    Distance to Destination:{" "}
                    {selectedParking.distance_to_destination}m
                  </Typography>
                </>
              )}
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleArriveParking}
                disabled={animationProgress < 1}
              >
                {animationProgress < 1
                  ? `Driving (${Math.round(animationProgress * 100)}%)`
                  : "Arrived at Parking Lot"}
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CityMapRoute;

// FrontEnd/src/components/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  CircularProgress,
  Button,
  Alert,
  AlertTitle,
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
  Chip,
  Tooltip,
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
import PaidIcon from "@mui/icons-material/Paid";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DestinationSelector from "./DestinationSelector";
import { api } from "../services/api";
import routesService from "../services/routesService";
import GoogleMap from "./GoogleMap"; // 导入新的GoogleMap组件

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
  const [navigationProgress, setNavigationProgress] = useState("idle");
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
  const [vehiclePosition, setVehiclePosition] = useState(null);
  const [activeParkingLot, setActiveParkingLot] = useState(null);
  const [parkingLotDetails, setParkingLotDetails] = useState(null);
  const [nearbyParkings, setNearbyParkings] = useState([]);
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [showArrivalDialog, setShowArrivalDialog] = useState(false);
  const animationTimerRef = useRef(null);
  const animationStartTimeRef = useRef(null);
  const animationDurationRef = useRef(5000); // 5秒动画时长

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

    // 如果已经获取到用户位置，则立即计算路线
    // 这样可以确保地图在用户选择目的地后立即更新
    if (userLocation && destination && destination.location) {
      console.log("选择了目的地，立即计算路线", {
        origin: userLocation,
        destination: destination.location,
      });
      calculateRoute(userLocation, destination.location);
    } else {
      console.log("选择了目的地，但用户位置未知，将在位置获取后计算路线");
    }
  };

  /**
   * 确认目的地并开始导航
   */
  const confirmDestination = () => {
    console.log("确认目的地：", selectedDestination);
    if (!selectedDestination) {
      setError("Please select a destination first");
      return;
    }

    // 更新导航状态
    setActiveStep(1); // 进入导航步骤
    setNavigationProgress("navigating");

    // 获取当前位置并计算路线 (如果还没有路线计算)
    if (!routeDetails && userLocation) {
      calculateRoute(userLocation, selectedDestination.location);
    }

    // 开始导航动画
    startNavigationAnimation();
  };

  /**
   * 开始导航动画
   */
  const startNavigationAnimation = () => {
    // 清除可能的旧计时器
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    setAnimationInProgress(true);
    setNavigationProgress(0); // 从0开始
    animationStartTimeRef.current = Date.now();

    // 创建动画计时器，每50ms更新一次
    animationTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - animationStartTimeRef.current;
      const progress = Math.min(
        100,
        (elapsed / animationDurationRef.current) * 100
      );

      setNavigationProgress(progress);

      // 动画完成
      if (progress >= 100) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
        setAnimationInProgress(false);

        // 居中显示目的地
        if (googleMapsRef.current && selectedDestination?.location) {
          googleMapsRef.current.panTo(selectedDestination.location);
          googleMapsRef.current.setZoom(15);
        }

        // 显示到达目的地对话框
        setShowArrivalDialog(true);
        setNavigationProgress("arrived");
      }
    }, 50);
  };

  /**
   * 启用AI引导停车
   */
  const enableAIParking = () => {
    setShowArrivalDialog(false);

    // 模拟获取附近停车场数据
    if (selectedDestination) {
      const mockNearbyParkings = [
        {
          id: "parking_1",
          name: `${selectedDestination.name} Parking A`,
          location: {
            lat: selectedDestination.location.lat + 0.002,
            lng: selectedDestination.location.lng + 0.003,
          },
          distance_to_destination: Math.floor(Math.random() * 200) + 100,
          available_spots: Math.floor(Math.random() * 30) + 5,
          total_spots: Math.floor(Math.random() * 50) + 40,
          hourly_rate: (Math.random() * 5 + 5).toFixed(2),
        },
        {
          id: "parking_2",
          name: `Downtown Parking`,
          location: {
            lat: selectedDestination.location.lat - 0.001,
            lng: selectedDestination.location.lng + 0.001,
          },
          distance_to_destination: Math.floor(Math.random() * 200) + 150,
          available_spots: Math.floor(Math.random() * 20) + 3,
          total_spots: Math.floor(Math.random() * 40) + 30,
          hourly_rate: (Math.random() * 4 + 3).toFixed(2),
        },
        {
          id: "parking_3",
          name: `Premium Parking`,
          location: {
            lat: selectedDestination.location.lat + 0.001,
            lng: selectedDestination.location.lng - 0.002,
          },
          distance_to_destination: Math.floor(Math.random() * 300) + 200,
          available_spots: Math.floor(Math.random() * 15) + 2,
          total_spots: Math.floor(Math.random() * 30) + 20,
          hourly_rate: (Math.random() * 6 + 8).toFixed(2),
        },
      ];

      setNearbyParkings(mockNearbyParkings);
    }

    setNavigationProgress("arrived");
  };

  /**
   * 跳过AI引导停车
   */
  const skipAIParking = () => {
    setShowArrivalDialog(false);
    setNavigationProgress("navigating");
  };

  const handleArriveParking = (parkingLot) => {
    setActiveStep(3);
    api
      .getParkingLotDetails(parkingLot.id)
      .then((details) => {
        setParkingLotDetails(details);
        setActiveParkingLot(parkingLot);
      })
      .catch((err) => {
        console.error("Error fetching parking lot details:", err);
        setParkingLotDetails({
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
    setParkingLotDetails(null);
    setActiveParkingLot(null);
    setNavigationProgress("idle");
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
          console.log("获取到用户位置:", currentLocation);
          setUserLocation(currentLocation);
          setLoadingLocation(false);

          // 如果用户已选择目的地，立即计算路线
          if (selectedDestination && selectedDestination.location) {
            console.log("用户位置更新，重新计算路线");
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

      // 如果有目的地，也计算路线
      if (selectedDestination && selectedDestination.location) {
        calculateRoute(defaultLocation, selectedDestination.location);
      }
    }
  };

  const calculateRoute = async (origin, destination) => {
    if (!origin || !destination) {
      console.error("无法计算路线：缺少起点或终点坐标", {
        origin,
        destination,
      });
      setMapError("无法计算路线：缺少起点或终点坐标");
      return null;
    }

    console.log("计算路线参数:", {
      origin: origin,
      destination: destination,
    });

    try {
      setIsMapLoading(true);
      setMapError(null);

      // 确保坐标是数字类型
      const validOrigin = {
        lat: Number(origin.lat),
        lng: Number(origin.lng),
      };

      const validDestination = {
        lat: Number(destination.lat),
        lng: Number(destination.lng),
      };

      // 调用路线服务
      const routeData = await routesService.calculateRoute(
        validOrigin,
        validDestination
      );

      // 记录结果以便调试
      console.log("路线计算结果:", routeData);

      // 设置路线详情，这将触发GoogleMap组件中的useEffect
      setRouteDetails(routeData);

      setIsMapLoading(false);
      return routeData;
    } catch (error) {
      console.error("计算路由时出错:", error);
      setIsMapLoading(false);
      setMapError(`计算路线失败: ${error.message}`);

      // 创建静态路线作为后备方案
      const staticRoute = routesService.createStaticRoute(origin, destination);
      setRouteDetails(staticRoute);
      return staticRoute;
    }
  };

  // 创建备用路线（在主方法失败时使用）
  const createFallbackRoute = (origin, destination) => {
    if (googleMapsRef.current) {
      try {
        // 清除之前的渲染器
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        // 创建简单的直线路径
        const simplePath = [
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng },
        ];

        // 创建路线线条
        const polyline = new google.maps.Polyline({
          path: simplePath,
          geodesic: true,
          strokeColor: "#ff4136",
          strokeOpacity: 0.7,
          strokeWeight: 3,
        });

        polyline.setMap(googleMapsRef.current);

        // 设置地图视图以显示整个路线
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
        bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));
        googleMapsRef.current.fitBounds(bounds);

        // 添加起点和终点标记
        new google.maps.Marker({
          position: origin,
          map: googleMapsRef.current,
          title: "Starting Point",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          },
        });

        new google.maps.Marker({
          position: destination,
          map: googleMapsRef.current,
          title: selectedDestination ? selectedDestination.name : "Destination",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });

        // 创建简单的路线详情以显示
        const distance = calculateDistance(origin, destination);
        const distanceKm = (distance / 1000).toFixed(1);
        const durationMinutes = Math.round((distance / 1000) * (60 / 50)); // 假设平均速度50km/h

        setRouteDetails({
          distance: `${distanceKm} km`,
          duration: `${durationMinutes} mins (est.)`,
          steps: [],
          isStaticRoute: true,
        });
      } catch (fallbackError) {
        console.error("创建备用路线也失败:", fallbackError);
      }
    }
  };

  // 计算两点之间的距离（米）- 便于创建备用路线
  const calculateDistance = (point1, point2) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
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

  // 检查初始化地图的逻辑
  useEffect(() => {
    // 页面加载时就获取当前位置并初始化地图，不再等待activeStep === 1
    getCurrentLocation();

    // 改进Google Maps加载逻辑
    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          console.log("Google Maps already loaded, using directly");
          resolve(window.google.maps);
          return;
        }

        // Check if script already exists
        const googleMapsScript = document.getElementById("google-maps-script");
        if (googleMapsScript) {
          console.log(
            "Google Maps script already exists, waiting for it to load"
          );
          // Create a check function
          const checkGoogleMapsLoaded = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkGoogleMapsLoaded);
              console.log("Google Maps loading complete");
              resolve(window.google.maps);
            }
          }, 100);

          // Set timeout
          setTimeout(() => {
            clearInterval(checkGoogleMapsLoaded);
            reject(new Error("Google Maps loading timeout"));
          }, 10000);
          return;
        }

        // Add new script
        console.log("Adding Google Maps script");
        const script = document.createElement("script");
        script.id = "google-maps-script";
        // Get API key from environment variables
        const apiKey =
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
          "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&map_ids=5a8d875e3485586f`;
        script.async = true;
        script.defer = true;

        // Create callback function
        const callbackName = `initGoogleMaps_${Date.now()}`;
        window[callbackName] = () => {
          console.log("Google Maps loading callback triggered");
          if (window.google && window.google.maps) {
            resolve(window.google.maps);
          } else {
            reject(new Error("Google Maps loading exception"));
          }
          delete window[callbackName];
        };

        // Add callback to URL
        script.src = `${script.src}&callback=${callbackName}`;

        // Handle script loading errors
        script.onerror = () => {
          reject(new Error("Google Maps script loading failed"));
        };

        document.head.appendChild(script);
      });
    };

    // Load map and initialize
    loadGoogleMaps()
      .then((googleMaps) => {
        console.log("Google Maps loaded successfully, initializing map");
        setGoogleMapsLoaded(true);
        initializeMap();
      })
      .catch((error) => {
        console.error("Google Maps loading failed:", error);
        setMapError("Failed to load Google Maps. Please try again later.");
      });
  }, []); // 只在组件挂载时运行一次

  // 添加全局样式控制，防止页面滚动
  useEffect(() => {
    // 添加防止滚动的样式
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";

    // 组件卸载时移除样式
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.height = "";
      document.body.style.margin = "";
    };
  }, []);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkMapsApiLoaded = () => {
      return window.google && window.google.maps;
    };

    // If already loaded, set state
    if (checkMapsApiLoaded()) {
      setMapsApiLoaded(true);
      return;
    }

    // Otherwise set an observer to wait for loading
    const apiLoadInterval = setInterval(() => {
      if (checkMapsApiLoaded()) {
        setMapsApiLoaded(true);
        clearInterval(apiLoadInterval);
      }
    }, 100);

    // Set timeout to avoid infinite waiting
    const timeout = setTimeout(() => {
      clearInterval(apiLoadInterval);
      if (!checkMapsApiLoaded()) {
        setError(
          "Google Maps API loading timeout. Please refresh the page to try again."
        );
      }
    }, 10000);

    // Cleanup function
    return () => {
      clearInterval(apiLoadInterval);
      clearTimeout(timeout);
    };
  }, []);

  // 初始化地图 - 仅在API加载完成后进行
  useEffect(() => {
    if (
      mapsApiLoaded &&
      userLocation &&
      selectedDestination &&
      selectedDestination.location
    ) {
      console.log("Maps API loaded, initializing map now");
      calculateRoute(userLocation, selectedDestination.location);
    }
  }, [mapsApiLoaded, userLocation, selectedDestination]);

  // 添加一个函数处理地图实例引用
  const handleMapReady = (mapInstance) => {
    console.log("地图实例已就绪");
    googleMapsRef.current = mapInstance;
  };

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
        height: "100vh",
        width: "100vw",
        position: "fixed", // 改为fixed定位
        top: 0,
        left: 0,
        overflow: "hidden", // 禁止溢出滚动
        backgroundColor: "#000", // 设置黑色背景，防止地图加载时的白色闪烁
      }}
    >
      {/* 作为全屏背景的导航地图 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%", // 确保宽度为100%
          height: "100%", // 确保高度为100%
          zIndex: 0,
          backgroundColor: "#202124", // 深色背景作为地图加载前的占位
        }}
      >
        {/* 使用GoogleMap组件 - 传递关键属性和回调 */}
        <GoogleMap
          origin={userLocation}
          destination={selectedDestination?.location}
          navigationProgress={navigationProgress}
          onPositionChange={(newPosition) => setVehiclePosition(newPosition)}
          routeDetails={routeDetails}
          onMapReady={handleMapReady}
          mapError={mapError}
          isLoading={loadingRoute || loadingLocation}
          key={`map-${selectedDestination?.id || "default"}`} // 添加key确保在选择新目的地时正确重渲染
        />
      </Box>

      {/* 顶部应用栏 */}
      <AppBar
        position="absolute"
        color="transparent"
        elevation={0}
        sx={{
          zIndex: 5,
          backgroundColor: "rgba(32,33,36,0.7)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            onClick={resetNavigation}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              ml: 1,
              fontSize: { xs: "0.9rem", sm: "1.25rem" },
            }}
          >
            Smart Parking System
          </Typography>
          <Typography
            variant="body2"
            color="inherit"
            sx={{ mr: 1, display: { xs: "none", sm: "block" } }}
          >
            {currentUser?.email || "User"}
          </Typography>
          <IconButton color="inherit" onClick={logout} size="small">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 垂直导航进度指示器 - Google Maps风格 */}
      <Box
        sx={{
          position: "absolute",
          top: 70,
          left: 15,
          bottom: navigationProgress !== "idle" ? 80 : 20,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          width: 60,
        }}
      >
        <Stepper
          activeStep={activeStep}
          orientation="vertical"
          sx={{
            backgroundColor: "rgba(32,33,36,0.75)",
            backdropFilter: "blur(8px)",
            borderRadius: 2,
            p: 1,
            height: "auto",
            color: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            "& .MuiStepConnector-line": {
              minHeight: 20,
            },
            "& .MuiStepLabel-label": {
              display: "none",
            },
            "& .MuiStepIcon-root": {
              color: "rgba(255,255,255,0.3)",
              "&.Mui-active": {
                color: "#1A73E8",
              },
              "&.Mui-completed": {
                color: "#34A853",
              },
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel></StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* 步骤提示文本 - 显示当前步骤 */}
      <Box
        sx={{
          position: "absolute",
          top: 15,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 6,
          backgroundColor: "rgba(32,33,36,0.75)",
          backdropFilter: "blur(8px)",
          borderRadius: 4,
          py: 0.5,
          px: 2,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        <Typography
          variant="body2"
          align="center"
          sx={{ fontWeight: 500, color: "white" }}
        >
          {steps[activeStep]}
        </Typography>
      </Box>

      {/* 主体内容区域 - 作为左侧浮动卡片显示在地图上 */}
      <Box
        sx={{
          position: "absolute",
          top: 70,
          left: 90,
          zIndex: 1,
          pointerEvents: "none", // 这允许点击穿透到地图
          maxWidth: {
            xs: "calc(100% - 100px)",
            sm: 350,
            md: 400,
          },
          maxHeight: "calc(100vh - 100px)",
        }}
      >
        {/* 内容卡片 - 根据导航阶段显示不同内容 */}
        <Card
          sx={{
            width: "100%",
            backgroundColor: "rgba(32,33,36,0.85)",
            backdropFilter: "blur(12px)",
            color: "white",
            borderRadius: 2,
            pointerEvents: "auto", // 恢复卡片的点击事件
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            overflow: "hidden",
            maxHeight: "calc(100vh - 100px)",
          }}
        >
          <CardContent sx={{ p: 2, pb: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1.5, fontWeight: 500, color: "#8AB4F8" }}
            >
              {navigationProgress === "idle"
                ? "Confirm Destination"
                : navigationProgress === "navigating"
                ? "Navigating to Destination"
                : navigationProgress === "arrived"
                ? "Select Parking Lot"
                : navigationProgress === "parking"
                ? "Finding Parking Spot"
                : "Parking Complete"}
            </Typography>

            {/* 当前位置显示 */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <MyLocationIcon
                  color="primary"
                  sx={{ mr: 1, fontSize: "1rem" }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Current Location
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ ml: 3, display: "block", color: "rgba(255,255,255,0.7)" }}
              >
                {userLocation?.lat?.toFixed(4)}, {userLocation?.lng?.toFixed(4)}
              </Typography>
            </Box>

            {/* 目的地选择和显示 */}
            {navigationProgress === "idle" && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <PlaceIcon color="error" sx={{ mr: 1, fontSize: "1rem" }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Destination
                  </Typography>
                </Box>

                {selectedDestination ? (
                  <Box sx={{ ml: 3, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedDestination.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "rgba(255,255,255,0.7)" }}
                    >
                      {selectedDestination.address || "No address available"}
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedDestination.category || "Place"}
                      sx={{ mt: 0.5, fontSize: "0.65rem", height: 20 }}
                    />
                  </Box>
                ) : (
                  <Alert
                    severity="info"
                    sx={{ mb: 2, ml: 3, py: 0, fontSize: "0.75rem" }}
                  >
                    Please select a destination
                  </Alert>
                )}

                <DestinationSelector onSelect={handleSelectDestination} />
              </Box>
            )}

            {/* 目的地已选择时显示信息 */}
            {navigationProgress !== "idle" && selectedDestination && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <PlaceIcon color="error" sx={{ mr: 1, fontSize: "1rem" }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Destination
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ ml: 3, fontWeight: 500 }}>
                  {selectedDestination.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ml: 3,
                    display: "block",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {selectedDestination.address || "No address available"}
                </Typography>
              </Box>
            )}

            {/* 路线信息 */}
            {(navigationProgress === "idle" ||
              navigationProgress === "navigating") &&
              routeDetails && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <DirectionsIcon
                      color="info"
                      sx={{ mr: 1, fontSize: "1rem" }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Route Information
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "rgba(255,255,255,0.7)" }}
                    >
                      Distance: {routeDetails.distance}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "rgba(255,255,255,0.7)" }}
                    >
                      Estimated Travel Time: {routeDetails.duration}
                    </Typography>
                  </Box>
                </Box>
              )}

            {/* 导航到目的地的按钮 */}
            {navigationProgress === "idle" && selectedDestination && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={confirmDestination}
                sx={{
                  mt: 2,
                  mb: 1,
                  py: 1,
                  backgroundColor: "#1A73E8",
                  "&:hover": {
                    backgroundColor: "#1765CC",
                  },
                }}
              >
                Start Navigation
              </Button>
            )}

            {/* 显示附近停车场 */}
            {navigationProgress === "arrived" && (
              <Box
                sx={{
                  maxHeight: "calc(100vh - 220px)",
                  overflowY: "auto",
                  pr: 1,
                  mr: -1,
                }}
              >
                <Typography
                  variant="body2"
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  Nearby Parking Lots
                </Typography>
                <Grid container spacing={1}>
                  {nearbyParkings.map((parking) => (
                    <Grid item xs={12} key={parking.id}>
                      <Card
                        sx={{
                          display: "flex",
                          mb: 1,
                          backgroundColor: "rgba(48,49,52,0.85)",
                          borderRadius: 1,
                        }}
                      >
                        <CardContent sx={{ flex: 1, p: 1.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 0.5 }}
                          >
                            {parking.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "rgba(255,255,255,0.6)",
                            }}
                          >
                            Distance to destination:{" "}
                            {parking.distance_to_destination || "Unknown"} m
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <Tooltip title="Available Spots">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mr: 2,
                                }}
                              >
                                <LocalParkingIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5, fontSize: "0.875rem" }}
                                />
                                <Typography variant="caption">
                                  {parking.available_spots}/
                                  {parking.total_spots}
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Tooltip title="Hourly Rate">
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <PaidIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5, fontSize: "0.875rem" }}
                                />
                                <Typography variant="caption">
                                  ${parking.hourly_rate}/hr
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Box>
                        </CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 1,
                          }}
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleArriveParking(parking)}
                            sx={{
                              fontSize: "0.7rem",
                              py: 0.5,
                              minWidth: "60px",
                              backgroundColor: "#1A73E8",
                              "&:hover": {
                                backgroundColor: "#1765CC",
                              },
                            }}
                          >
                            Select
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* 停车场内UI - 移到中心悬浮窗 */}
            {navigationProgress === "parking" && (
              <Box
                sx={{
                  maxHeight: "calc(100vh - 220px)",
                  overflowY: "auto",
                  pr: 1,
                  mr: -1,
                }}
              >
                <Typography
                  variant="body2"
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  Smart Parking Assistant
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "rgba(255,255,255,0.7)",
                    mb: 1,
                  }}
                >
                  AI has selected the best spot for you:
                  {parkingLotDetails?.recommended_spot?.id || ""}
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={completeParking}
                  sx={{
                    mt: 1,
                    mb: 1,
                    py: 1,
                    backgroundColor: "#34A853",
                    "&:hover": {
                      backgroundColor: "#2E8B57",
                    },
                  }}
                >
                  Complete Parking
                </Button>
              </Box>
            )}

            {/* 完成停车 */}
            {navigationProgress === "completed" && (
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  Parking Successful!
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 1,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Your vehicle has been parked successfully
                </Typography>
                <Typography
                  variant="body2"
                  color="#34A853"
                  paragraph
                  sx={{ fontWeight: 500 }}
                >
                  Your parking spot:
                  {parkingLotDetails?.recommended_spot?.id || ""}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={resetNavigation}
                  sx={{
                    mt: 1,
                    backgroundColor: "#1A73E8",
                    "&:hover": {
                      backgroundColor: "#1765CC",
                    },
                  }}
                >
                  Start New Trip
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 停车场俯视图悬浮窗 - 在地图中央显示 */}
      {navigationProgress === "parking" && parkingLotDetails && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 4,
            maxWidth: 600,
            width: "80%",
            maxHeight: "70vh",
            backgroundColor: "rgba(32,33,36,0.9)",
            backdropFilter: "blur(12px)",
            borderRadius: 2,
            p: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            display: { xs: "none", md: "block" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 500, color: "white" }}
            >
              Parking Lot View
            </Typography>
            <IconButton size="small" sx={{ color: "white" }} onClick={() => {}}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <ParkingLotView
            parkingLot={parkingLotDetails}
            vehiclePosition={vehiclePosition}
            recommendedSpot={parkingLotDetails.recommended_spot}
            onCompleteParking={completeParking}
          />
        </Box>
      )}

      {/* 固定在底部的控制栏 */}
      {navigationProgress !== "idle" && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(32,33,36,0.85)",
            backdropFilter: "blur(12px)",
            p: 1.5,
            zIndex: 3,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={resetNavigation}
              size="small"
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Cancel
            </Button>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {navigationProgress === "navigating"
                ? "Navigating to destination..."
                : navigationProgress === "arrived"
                ? "Please select a parking lot"
                : navigationProgress === "parking"
                ? "Finding the best parking spot..."
                : "Parking complete"}
            </Typography>
            {navigationProgress === "navigating" && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setNavigationProgress("arrived")}
                sx={{
                  backgroundColor: "#1A73E8",
                  "&:hover": {
                    backgroundColor: "#1765CC",
                  },
                }}
              >
                Simulate Arrival
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* 动态阶段图标 - 右上角 */}
      <Box
        sx={{
          position: "absolute",
          top: 80,
          right: 20,
          backgroundColor: "rgba(32,33,36,0.75)",
          backdropFilter: "blur(8px)",
          borderRadius: "50%",
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {navigationProgress === "idle" ? (
          <PlaceIcon sx={{ color: "#FF4136", fontSize: 28 }} />
        ) : navigationProgress === "navigating" ? (
          <DirectionsCarIcon sx={{ color: "#1A73E8", fontSize: 28 }} />
        ) : navigationProgress === "arrived" ? (
          <LocalParkingIcon sx={{ color: "#FFDC00", fontSize: 28 }} />
        ) : navigationProgress === "parking" ? (
          <LocalParkingIcon sx={{ color: "#2ECC40", fontSize: 28 }} />
        ) : (
          <CheckCircleIcon sx={{ color: "#2ECC40", fontSize: 28 }} />
        )}
      </Box>

      {/* 到达目的地对话框 */}
      {showArrivalDialog && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            backgroundColor: "rgba(32,33,36,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: 2,
            p: 3,
            width: { xs: "90%", sm: 400 },
            maxWidth: 450,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            color: "white",
            textAlign: "center",
          }}
        >
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />

          <Typography variant="h5" gutterBottom fontWeight={500}>
            Destination Reached
          </Typography>

          <Typography variant="body1" paragraph>
            You have arrived at {selectedDestination?.name}. Would you like to
            use AI-guided parking assistance?
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={skipAIParking}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                width: "48%",
              }}
            >
              Skip
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={enableAIParking}
              sx={{
                backgroundColor: "#1A73E8",
                "&:hover": {
                  backgroundColor: "#1765CC",
                },
                width: "48%",
              }}
            >
              Enable AI Parking
            </Button>
          </Box>
        </Box>
      )}

      {/* 地图图例 - 保持在左下角但样式优化 */}
      <Box
        sx={{
          position: "absolute",
          bottom: navigationProgress !== "idle" ? 80 : 24, // 当有底部导航栏时，距离底部80px，否则24px
          left: 24,
          bgcolor: "rgba(32, 33, 36, 0.85)",
          backdropFilter: "blur(8px)",
          borderRadius: 2,
          p: 2,
          zIndex: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          minWidth: "180px",
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{
            mb: 1.5,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PlaceIcon sx={{ fontSize: 18 }} />
          Map Legend
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#4CAF50",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: 400,
              }}
            >
              Current Location
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#F44336",
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: 400,
              }}
            >
              Destination
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  AlertTitle,
  Button,
} from "@mui/material";
import mapsService from "../services/mapsService";

/**
 * GoogleMap 组件 - 负责加载和显示 Google Maps
 *
 * @param {Object} props - 组件属性
 * @param {Object} props.origin - 起点坐标 {lat, lng}
 * @param {Object} props.destination - 终点坐标 {lat, lng}
 * @param {string|number} props.navigationProgress - 导航进度 (idle, 0-100, navigating, arrived, parking, completed)
 * @param {Function} props.onPositionChange - 位置变化回调
 * @param {Object} props.mapOptions - 地图配置选项
 * @param {Object} props.routeDetails - 路线详情
 * @param {Function} props.onMapReady - 地图就绪回调，用于共享地图实例
 * @param {string} props.mapError - 从父组件传入的地图错误信息
 * @param {boolean} props.isLoading - 指示父组件是否正在加载数据
 */
const GoogleMap = ({
  origin,
  destination,
  navigationProgress,
  onPositionChange,
  mapOptions = {},
  routeDetails,
  onMapReady,
  mapError: externalMapError,
  isLoading: externalLoading,
}) => {
  // 状态和引用
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const routePathRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const polylineRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // 记录之前的目的地以检测变化
  const prevDestinationRef = useRef(null);

  // 加载 Google Maps API
  const loadMapsApi = async () => {
    if (loadingApi) return;

    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("Google Maps API已经加载完成");
      setMapsApiLoaded(true);
      return;
    }

    try {
      console.log("开始加载Google Maps API...");
      setLoadingApi(true);
      await mapsService.ensureApiLoaded();
      console.log("Google Maps API加载成功");
      setMapsApiLoaded(true);
      setError(null);
    } catch (err) {
      console.error("加载 Google Maps API 失败:", err);
      setError("加载 Google Maps API 失败，请刷新页面或稍后再试。");
    } finally {
      setLoadingApi(false);
    }
  };

  // 在组件挂载时加载 Google Maps API
  useEffect(() => {
    console.log("GoogleMap组件挂载，加载Maps API");
    loadMapsApi();
  }, []);

  // 初始化地图
  const initMap = () => {
    try {
      // 确保地图容器存在
      if (!mapRef.current) {
        console.error("地图容器不存在");
        return;
      }

      // 确认 Google Maps API 已加载
      if (!window.google || !window.google.maps) {
        console.error("无法初始化地图: Google Maps 未加载");
        setError("Google Maps API 未加载，请刷新页面。");
        return;
      }

      console.log("初始化地图...", {
        origin: origin || "无",
        destination: destination || "无",
      });
      setLoading(true);

      // 确定地图中心
      const center = origin || destination || { lat: -36.8485, lng: 174.7633 };

      // 默认地图选项
      const defaultOptions = {
        center: center,
        zoom: 14,
        mapId: "5a8d875e3485586f",
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
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
      };

      // 合并用户提供的选项
      const options = { ...defaultOptions, ...mapOptions };

      // 创建地图
      const map = new window.google.maps.Map(mapRef.current, options);
      mapInstanceRef.current = map;

      // 通知父组件地图已准备就绪
      if (onMapReady) {
        onMapReady(map);
      }

      // 初始化 DirectionsService 和 DirectionsRenderer
      initDirectionsService();

      setMapInitialized(true);
      console.log("地图初始化完成");

      // 如果已有origin和destination，显示路线
      if (origin && destination) {
        console.log("初始化地图时已有起点和终点，显示路线");
        displayRoute(origin, destination);
      } else if (origin) {
        // 只有起点
        console.log("初始化地图时只有起点，显示起点位置");
        showCurrentLocation(origin);
      } else if (destination) {
        // 只有终点
        console.log("初始化地图时只有终点，显示终点位置");
        showDestination(destination);
      }

      setLoading(false);
    } catch (err) {
      console.error("初始化地图错误:", err);
      setError("设置地图时出错: " + err.message);
      setLoading(false);
    }
  };

  // 初始化方向服务和渲染器
  const initDirectionsService = () => {
    if (!window.google || !window.google.maps) return;

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      console.log("DirectionsService初始化成功");
    }

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
        {
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#4fc3f7",
            strokeOpacity: 1.0,
            strokeWeight: 4,
          },
        }
      );
      console.log("DirectionsRenderer初始化成功");
    }
  };

  // 显示目的地位置
  const showDestination = (position) => {
    if (!mapInstanceRef.current) return;

    console.log("显示目的地位置:", position);

    try {
      // 清除旧的目的地标记
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
      }

      // 创建新的目的地标记
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: "目的地",
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#F44336",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 8,
        },
      });

      // 将地图中心设置为目的地
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(14);
    } catch (error) {
      console.error("显示目的地位置错误:", error);
      setError("无法显示目的地位置");
    }
  };

  // 显示路线 - 处理不同来源的路线数据
  const displayRoute = async (origin, destination) => {
    if (!mapInstanceRef.current) {
      console.error("地图实例不存在，无法显示路线");
      return;
    }

    console.log("显示路线，参数:", {
      origin,
      destination,
      routeDetails: routeDetails
        ? {
            fromRoutesAPI: routeDetails.fromRoutesAPI,
            fromJSAPI: routeDetails.fromJSAPI,
            hasEncodedPolyline: !!routeDetails.encodedPolyline,
            isStaticRoute: routeDetails.isStaticRoute,
          }
        : null,
    });
    setLoading(true);

    try {
      // 清除现有的路线显示
      clearExistingRoute();

      // 检查routeDetails的类型和来源
      if (routeDetails) {
        if (routeDetails.fromJSAPI && routeDetails.rawResult) {
          // 如果路线来自JavaScript API
          console.log("显示来自DirectionsService的路线");
          displayDirectionsServiceRoute(routeDetails.rawResult);
        } else if (routeDetails.encodedPolyline) {
          // 如果路线来自Routes API（带有编码多段线）
          console.log("显示来自Routes API的路线（编码多段线）");
          displayEncodedPolyline(
            routeDetails.encodedPolyline,
            origin,
            destination
          );
        } else if (routeDetails.isStaticRoute) {
          // 如果是静态路线
          console.log("显示静态路线");
          renderSimplePath(origin, destination);
        } else {
          // 其他情况，使用简单路径
          console.log("未识别的路线格式，使用简单路径");
          renderSimplePath(origin, destination);
        }
      } else {
        // 没有路线详情，显示简单路径
        console.log("无路线详情，显示简单路径");
        renderSimplePath(origin, destination);
      }
    } catch (error) {
      console.error("显示路线错误:", error);
      setError("无法显示路线: " + error.message);
      // 出错时显示简单路径
      renderSimplePath(origin, destination);
    } finally {
      setLoading(false);
    }
  };

  // 清除现有路线
  const clearExistingRoute = () => {
    // 清除DirectionsRenderer
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    // 清除Polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // 清除移动标记
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 不要清除起点和终点标记，这样可以保持它们始终显示
  };

  // 显示来自DirectionsService的路线
  const displayDirectionsServiceRoute = (result) => {
    if (!mapInstanceRef.current) {
      console.error("地图实例不存在，无法显示DirectionsService路线");
      return;
    }

    directionsRendererRef.current.setMap(mapInstanceRef.current);
    directionsRendererRef.current.setDirections(result);

    // 存储路径用于动画
    if (result.routes && result.routes.length > 0) {
      routePathRef.current = result.routes[0].overview_path;
    }

    // 创建移动标记
    if (routePathRef.current.length > 0) {
      createMovingMarker(routePathRef.current[0]);
    }
  };

  // 显示编码多段线
  const displayEncodedPolyline = (encodedPolyline, origin, destination) => {
    try {
      // 检查几何库是否可用
      if (
        !window.google ||
        !window.google.maps ||
        !window.google.maps.geometry ||
        !window.google.maps.geometry.encoding
      ) {
        console.warn("Google Maps几何库不可用，无法解码路线");
        renderSimplePath(origin, destination);
        return;
      }

      console.log("开始解码多段线...");

      // 解码路径
      try {
        const decodedPath =
          window.google.maps.geometry.encoding.decodePath(encodedPolyline);
        console.log(`解码成功，路径包含${decodedPath.length}个点`);

        if (decodedPath.length === 0) {
          console.warn("解码后的路径为空，使用简单路径");
          renderSimplePath(origin, destination);
          return;
        }

        routePathRef.current = decodedPath;

        // 创建路线线条
        console.log("创建路线线条...");
        polylineRef.current = new window.google.maps.Polyline({
          path: decodedPath,
          geodesic: true,
          strokeColor: "#4fc3f7",
          strokeWeight: 5,
          strokeOpacity: 0.8,
        });

        // 确保地图实例存在
        if (!mapInstanceRef.current) {
          console.error("地图实例不存在，无法显示路线");
          return;
        }

        console.log("将路线线条添加到地图...");
        polylineRef.current.setMap(mapInstanceRef.current);

        // 添加起点和终点标记
        console.log("添加起点和终点标记...");
        addEndpointMarkers(origin, destination);

        // 设置视图范围
        console.log("调整地图视图...");
        fitMapToBounds(decodedPath, origin, destination);

        // 创建移动标记
        console.log("创建移动标记...");
        createMovingMarker(decodedPath[0]);

        console.log("路线显示完成");
      } catch (decodeError) {
        console.error("解码多段线失败:", decodeError);
        console.log(
          "尝试解码的多段线:",
          encodedPolyline.substring(0, 50) + "..."
        );
        renderSimplePath(origin, destination);
      }
    } catch (error) {
      console.error("显示编码多段线错误:", error);
      renderSimplePath(origin, destination);
    }
  };

  // 渲染简单路径（直线）
  const renderSimplePath = (origin, destination) => {
    if (!mapInstanceRef.current || !origin || !destination) {
      console.error("缺少渲染简单路径的必要条件");
      return;
    }

    console.log("渲染简单路径从", origin, "到", destination);

    try {
      // 创建简单的直线路径
      const simplePath = [
        new window.google.maps.LatLng(origin.lat, origin.lng),
        new window.google.maps.LatLng(destination.lat, destination.lng),
      ];

      routePathRef.current = simplePath;

      // 创建路线线条
      polylineRef.current = new window.google.maps.Polyline({
        path: simplePath,
        geodesic: true,
        strokeColor: "#4fc3f7",
        strokeOpacity: 0.8,
        strokeWeight: 5,
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: 1,
              scale: 3,
            },
            offset: "0",
            repeat: "20px",
          },
        ],
      });

      polylineRef.current.setMap(mapInstanceRef.current);

      // 添加起点和终点标记
      addEndpointMarkers(origin, destination);

      // 设置地图视图
      fitMapToBounds(simplePath, origin, destination);

      // 创建移动标记
      createMovingMarker(simplePath[0]);
    } catch (error) {
      console.error("创建静态路径错误:", error);
      setError("无法显示导航路线，请刷新页面重试。");
    }
  };

  // 添加起点和终点标记
  const addEndpointMarkers = (origin, destination) => {
    if (!mapInstanceRef.current) return;

    // 清除旧的起点终点标记
    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    // 添加起点标记
    if (origin) {
      originMarkerRef.current = new window.google.maps.Marker({
        position: origin,
        map: mapInstanceRef.current,
        title: "起点",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#4CAF50",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 8,
        },
        zIndex: 1,
      });
    }

    // 添加终点标记
    if (destination) {
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: destination,
        map: mapInstanceRef.current,
        title: "目的地",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#F44336",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 8,
        },
        zIndex: 1,
      });
    }
  };

  // 调整地图视图以适应路径
  const fitMapToBounds = (path, origin, destination) => {
    if (!mapInstanceRef.current) return;

    try {
      const bounds = new window.google.maps.LatLngBounds();

      // 如果有原点和目的地，先添加这两个点
      if (origin)
        bounds.extend(new window.google.maps.LatLng(origin.lat, origin.lng));
      if (destination)
        bounds.extend(
          new window.google.maps.LatLng(destination.lat, destination.lng)
        );

      // 如果路径是数组，添加所有点
      if (Array.isArray(path) && path.length > 0) {
        path.forEach((point) => bounds.extend(point));
        console.log(`将${path.length}个路径点添加到边界`);
      }

      // 确保边界有效
      if (!bounds.isEmpty()) {
        console.log("调整地图视图以适应路线");
        mapInstanceRef.current.fitBounds(bounds);

        // 为了更好的可视效果，稍微缩小一点
        const zoom = mapInstanceRef.current.getZoom();
        mapInstanceRef.current.setZoom(zoom - 0.5);
      } else {
        console.warn("边界为空，无法调整地图视图");
        // 如果边界为空但有起点，则以起点为中心
        if (origin) {
          mapInstanceRef.current.setCenter(
            new window.google.maps.LatLng(origin.lat, origin.lng)
          );
          mapInstanceRef.current.setZoom(14);
        } else if (destination) {
          mapInstanceRef.current.setCenter(
            new window.google.maps.LatLng(destination.lat, destination.lng)
          );
          mapInstanceRef.current.setZoom(14);
        }
      }
    } catch (error) {
      console.error("调整地图视图错误:", error);
    }
  };

  // 显示当前位置
  const showCurrentLocation = (position) => {
    if (!mapInstanceRef.current) return;

    console.log("显示当前位置:", position);

    try {
      // 清除旧的起点标记
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
      }

      // 创建位置标记
      originMarkerRef.current = new window.google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: "当前位置",
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#4CAF50",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 8,
        },
      });

      // 设置地图中心
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(15);
    } catch (error) {
      console.error("显示当前位置错误:", error);
      setError("无法显示当前位置");
    }
  };

  // 创建移动标记
  const createMovingMarker = (initialPosition) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position: initialPosition,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
        rotation: 0,
      },
      zIndex: 10, // 确保车辆图标位于最上层
    });
  };

  // 动画移动标记
  const startCarAnimation = () => {
    const path = routePathRef.current;
    if (!path || path.length < 2 || !markerRef.current) return;

    // 清除之前的动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // 计算当前位置
    let progress = 0;

    // 处理不同类型的导航进度
    if (typeof navigationProgress === "number") {
      progress = navigationProgress / 100; // 在0和1之间
    } else if (navigationProgress === "navigating") {
      progress = 0.5; // 导航时的默认进度
    } else if (navigationProgress === "arrived") {
      progress = 1; // 到达
    } else {
      progress = 0; // 默认进度
    }

    const totalPathLength = path.length - 1;

    const animate = () => {
      // 处理数字导航进度
      if (typeof navigationProgress === "number") {
        progress = navigationProgress / 100;
      }

      if (progress >= 1) {
        // 到达目的地
        if (markerRef.current) {
          markerRef.current.setPosition(path[path.length - 1]);

          // 通知位置变化
          if (onPositionChange) {
            onPositionChange({
              lat: path[path.length - 1].lat(),
              lng: path[path.length - 1].lng(),
            });
          }
        }
        return;
      }

      // 计算路径上的当前位置
      const pathIndex = Math.min(
        Math.floor(progress * totalPathLength),
        totalPathLength - 1
      );

      // 计算两点之间的位置
      const segmentProgress = progress * totalPathLength - pathIndex;

      const currentPoint = path[pathIndex];
      const nextPoint = path[pathIndex + 1];

      // 计算当前位置（点之间的插值）
      const lat =
        currentPoint.lat() +
        (nextPoint.lat() - currentPoint.lat()) * segmentProgress;
      const lng =
        currentPoint.lng() +
        (nextPoint.lng() - currentPoint.lng()) * segmentProgress;

      // 计算前进角度（朝向）
      const heading = google.maps.geometry.spherical.computeHeading(
        currentPoint,
        nextPoint
      );

      // 更新标记位置和朝向
      const newPosition = new window.google.maps.LatLng(lat, lng);
      markerRef.current.setPosition(newPosition);

      // 更新图标朝向
      const icon = markerRef.current.getIcon();
      if (icon) {
        icon.rotation = heading;
        markerRef.current.setIcon(icon);
      }

      // 添加跟随效果 - 地图跟随车辆移动
      if (typeof navigationProgress === "number" && navigationProgress < 95) {
        mapInstanceRef.current.panTo(newPosition);
      }

      // 通知位置变化
      if (onPositionChange) {
        onPositionChange({
          lat: lat,
          lng: lng,
        });
      }

      // 请求下一帧动画
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 开始动画
    animate();
  };

  // 在 API 加载后初始化地图
  useEffect(() => {
    if (mapsApiLoaded && !mapInitialized) {
      console.log("Maps API 已加载，开始初始化地图");
      initMap();
    }
  }, [mapsApiLoaded]);

  // 当目的地坐标变化时重新定位地图
  useEffect(() => {
    if (!mapInstanceRef.current || !destination) return;

    // 比较新旧目的地是否相同
    const prevDest = prevDestinationRef.current;
    const isSameDestination =
      prevDest &&
      prevDest.lat === destination.lat &&
      prevDest.lng === destination.lng;

    // 更新目的地引用
    prevDestinationRef.current = destination;

    if (isSameDestination) {
      console.log("目的地坐标未变化，无需更新地图");
      return;
    }

    console.log("目的地坐标变化，更新地图位置:", destination);

    // 如果有起点坐标，计算路线
    if (origin) {
      console.log("有起点和终点，显示路线");
      displayRoute(origin, destination);
    } else {
      // 如果只有目的地，仅显示目的地
      console.log("只有目的地，显示目的地位置");
      showDestination(destination);
    }
  }, [destination]);

  // 当路线详情变化时更新路线显示
  useEffect(() => {
    if (!mapInstanceRef.current || !origin || !destination || !routeDetails)
      return;

    console.log("路线详情变化，更新路线显示");
    displayRoute(origin, destination);
  }, [routeDetails]);

  // 当起点坐标变化时更新地图
  useEffect(() => {
    if (!mapInstanceRef.current || !origin) return;

    console.log("起点坐标变化:", origin);

    // 如果有目的地坐标，计算路线
    if (destination) {
      console.log("有起点和终点，显示路线");
      displayRoute(origin, destination);
    } else {
      // 如果只有起点，仅显示起点
      console.log("只有起点，显示起点位置");
      showCurrentLocation(origin);
    }
  }, [origin]);

  // 根据导航进度更新车辆位置
  useEffect(() => {
    if (
      !loading &&
      markerRef.current &&
      routePathRef.current &&
      routePathRef.current.length > 0
    ) {
      startCarAnimation();
    }
  }, [navigationProgress, loading]);

  // 处理外部错误信息
  useEffect(() => {
    if (externalMapError) {
      setError(externalMapError);
    }
  }, [externalMapError]);

  // 处理外部加载状态
  useEffect(() => {
    if (externalLoading !== undefined) {
      setLoading(externalLoading);
    }
  }, [externalLoading]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      console.log("GoogleMap组件卸载，清理资源");

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (directionsRendererRef.current && mapInstanceRef.current) {
        directionsRendererRef.current.setMap(null);
      }

      if (polylineRef.current && mapInstanceRef.current) {
        polylineRef.current.setMap(null);
      }

      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setMap(null);
      }

      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
      }

      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
      }
    };
  }, []);

  // 调试输出
  useEffect(() => {
    console.log("GoogleMap组件状态:", {
      mapsApiLoaded,
      mapInitialized,
      hasOrigin: !!origin,
      hasDestination: !!destination,
      hasRouteDetails: !!routeDetails,
      loading,
      error: error || externalMapError,
    });
  }, [
    mapsApiLoaded,
    mapInitialized,
    origin,
    destination,
    routeDetails,
    loading,
    error,
    externalMapError,
  ]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        bgcolor: "#202124",
      }}
    >
      {/* 显示加载指示器 */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.7)",
            zIndex: 2,
          }}
        >
          <CircularProgress color="primary" size={40} thickness={4} />
          <Typography variant="body2" color="white" sx={{ mt: 2 }}>
            加载地图中...
          </Typography>
        </Box>
      )}

      {/* 显示错误信息 */}
      {(error || externalMapError) && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.7)",
            zIndex: 2,
            p: 2,
          }}
        >
          <Alert
            severity="error"
            sx={{
              width: "100%",
              maxWidth: 500,
              fontSize: "0.9rem",
              "& .MuiAlert-icon": { fontSize: "1.5rem" },
              bgcolor: "rgba(211, 47, 47, 0.9)",
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setError(null);
                  loadMapsApi();
                }}
              >
                重试
              </Button>
            }
          >
            <AlertTitle>地图加载错误</AlertTitle>
            {error || externalMapError}
          </Alert>
        </Box>
      )}

      {/* 地图未加载时显示占位符 */}
      {(!mapsApiLoaded || loadingApi) && !error && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#202124",
            zIndex: 1,
          }}
        >
          <CircularProgress color="primary" size={30} />
          <Typography variant="body2" color="white" sx={{ mt: 2 }}>
            加载 Google Maps...
          </Typography>
        </Box>
      )}

      {/* 地图容器 */}
      <Box
        ref={mapRef}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100%",
          width: "100%",
        }}
      />

      {/* 地图图例 */}
      {!loading && !error && mapsApiLoaded && (
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
            sx={{ mb: 1, color: "white" }}
          >
            地图图例
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
              起点
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
              目的地
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default GoogleMap;

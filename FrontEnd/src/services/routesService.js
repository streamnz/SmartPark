/**
 * 路线服务 - 提供路线计算和导航功能
 */

// 获取API基础URL
const getBaseApiUrl = () => {
  const domain = window.location.origin;
  if (domain.includes("localhost")) {
    return "http://localhost:5001/api";
  } else if (domain.includes("smartpark.streamnz.com")) {
    return "https://smartparking-api.streamnz.com/api"; // 修正为正确的API域名
  } else {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  }
};

// 获取API密钥
const getApiKey = () => {
  // 首先尝试从环境变量获取
  const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 如果环境变量中有密钥，则返回
  if (envApiKey) {
    return envApiKey;
  }

  // 如果环境变量不可用，使用硬编码密钥（不推荐，仅作为备份）
  console.warn("API密钥未在环境变量中找到，使用备用密钥");
  return "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";
};

// 获取API密钥
const API_KEY = getApiKey();

/**
 * 计算两点之间的路线
 * @param {Object} origin - 起点坐标 {lat, lng}
 * @param {Object} destination - 终点坐标 {lat, lng}
 * @returns {Promise<Object>} - 包含路线详情的Promise
 */
const calculateRoute = async (origin, destination) => {
  console.log("路线服务 - 计算路线:", origin, "到", destination);

  if (!origin || !destination) {
    console.error("缺少起点或终点坐标");
    return null;
  }

  try {
    // 使用Routes API
    console.log("尝试使用Google Maps Routes API计算路线");

    // 使用Routes API端点
    const response = await fetch(
      `https://routes.googleapis.com/directions/v2:computeRoutes?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          computeAlternativeRoutes: false,
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false,
          },
          languageCode: "zh-CN",
          units: "METRIC",
        }),
      }
    );

    // 解析响应
    if (!response.ok) {
      // 如果Routes API调用失败，使用备用方法
      console.warn("Routes API调用失败，使用备用方法");
      return await calculateRouteUsingJavaScriptAPI(origin, destination);
    }

    const data = await response.json();
    console.log("Routes API返回数据:", data);

    // 格式化响应
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      // 提取步骤信息（如果可用）
      let steps = [];
      if (route.legs && route.legs.length > 0) {
        route.legs.forEach((leg) => {
          if (leg.steps) {
            steps = steps.concat(
              leg.steps.map((step) => ({
                instructions:
                  step.navigationInstruction?.instructions || "继续行驶",
                distance: step.distanceMeters
                  ? `${(step.distanceMeters / 1000).toFixed(1)} km`
                  : "",
                duration: step.duration
                  ? `${Math.round(
                      parseInt(step.duration.replace("s", "")) / 60
                    )} mins`
                  : "",
              }))
            );
          }
        });
      }

      // 如果没有步骤信息，添加一个简单的步骤
      if (steps.length === 0) {
        steps.push({
          instructions: "驾驶至目的地",
          distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
          duration: route.duration
            ? `${Math.round(
                parseInt(route.duration.replace("s", "")) / 60
              )} mins`
            : "未知",
        });
      }

      // 创建路线详情对象
      return {
        fromRoutesAPI: true,
        distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
        duration: route.duration
          ? `${Math.round(parseInt(route.duration.replace("s", "")) / 60)} mins`
          : "未知",
        encodedPolyline: route.polyline?.encodedPolyline,
        steps: steps,
      };
    }

    throw new Error("未找到路线");
  } catch (error) {
    console.error("使用Routes API计算路线时出错:", error);

    // 尝试使用JavaScript API作为备用
    try {
      return await calculateRouteUsingJavaScriptAPI(origin, destination);
    } catch (jsApiError) {
      console.error("JavaScript API路线计算也失败:", jsApiError);

      // 最后的备用：使用静态路线
      return createStaticRoute(origin, destination);
    }
  }
};

/**
 * 备用方法：使用Google Maps JavaScript API
 * @param {Object} origin - 起点坐标 {lat, lng}
 * @param {Object} destination - 终点坐标 {lat, lng}
 * @returns {Promise<Object>} - 路线详情
 */
const calculateRouteUsingJavaScriptAPI = (origin, destination) => {
  return new Promise((resolve, reject) => {
    try {
      // 检查Google Maps是否已加载
      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps JavaScript API未加载");
      }

      console.log("使用Google Maps DirectionsService作为备用");

      // 创建DirectionsService实例
      const directionsService = new window.google.maps.DirectionsService();

      // 请求路线
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            // 提取路线信息
            const route = result.routes[0];
            const leg = route.legs[0];

            // 格式化步骤
            const steps = leg.steps.map((step) => ({
              instructions: step.instructions,
              distance: step.distance.text,
              duration: step.duration.text,
            }));

            // 创建路线详情对象
            resolve({
              distance: leg.distance.text,
              duration: leg.duration.text,
              steps: steps,
              // 添加标志表明这是来自JavaScript API
              fromJSAPI: true,
              // 存储原始结果用于渲染
              rawResult: result,
            });
          } else {
            reject(new Error(`DirectionsService失败: ${status}`));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 创建静态路线（当API不可用时）
 * @param {Object} origin - 起点坐标
 * @param {Object} destination - 终点坐标
 * @returns {Object} - 静态路线详情
 */
const createStaticRoute = (origin, destination) => {
  console.log("创建静态路线 - 所有API方法都失败");

  // 粗略计算距离（公里）
  const distance = calculateDistance(origin, destination);

  // 粗略计算时间（分钟）
  const duration = Math.round(distance / 0.7); // 假设平均速度42km/h

  return {
    isStaticRoute: true,
    distance: `${distance.toFixed(1)} km`,
    duration: `${duration} mins`,
    steps: [
      {
        distance: `${distance.toFixed(1)} km`,
        duration: `${duration} mins`,
        instructions: "驾驶至目的地",
      },
    ],
    bounds: {
      northeast: {
        lat: Math.max(origin.lat, destination.lat) + 0.01,
        lng: Math.max(origin.lng, destination.lng) + 0.01,
      },
      southwest: {
        lat: Math.min(origin.lat, destination.lat) - 0.01,
        lng: Math.min(origin.lng, destination.lng) - 0.01,
      },
    },
  };
};

/**
 * 计算两点之间的距离（公里）
 * @param {Object} point1 - 第一个点的坐标 {lat, lng}
 * @param {Object} point2 - 第二个点的坐标 {lat, lng}
 * @returns {number} - 距离（公里）
 */
const calculateDistance = (point1, point2) => {
  const R = 6371; // 地球半径（公里）
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // 距离（公里）

  return distance;
};

export default {
  calculateRoute,
  createStaticRoute,
  calculateDistance,
};

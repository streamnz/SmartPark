// FrontEnd/src/services/api.js
import axios from "axios";

// 获取API基础URL - 根据环境不同使用不同的URL
const getBaseUrl = () => {
  // 检查是否处于生产环境
  const isProduction = import.meta.env.MODE === "production";

  // 从环境变量获取API URL（如果配置了的话）
  const envApiUrl = import.meta.env.VITE_API_URL;

  if (envApiUrl) {
    return envApiUrl;
  }

  // 根据环境返回不同的基础URL
  if (isProduction) {
    return "https://smartparking-api.streamnz.com";
  } else {
    // 开发环境：使用本地后端端口
    return "http://localhost:5001";
  }
};

// API基础URL - 在生产环境应更新为实际后端URL
const BASE_URL = getBaseUrl();

console.log(`API服务使用基础URL: ${BASE_URL}`);

// 创建API客户端
const apiClient = axios.create({
  baseURL: BASE_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 请求超时时间
});

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误 - 身份验证失败
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const api = {
  // 获取车辆列表
  getVehicles: async () => {
    try {
      const response = await apiClient.get("/vehicles");
      return response.data;
    } catch (error) {
      console.error("Error fetching vehicles:", error);

      // 使用备用模拟数据
      return {
        status: "success",
        data: [
          {
            id: "sedan",
            name: "Sedan",
            width: 1.8,
            length: 4.5,
            height: 1.5,
            description:
              "Standard mid-size sedan, suitable for most parking spots.",
            model_path: "/models/sedan.glb",
          },
          {
            id: "suv",
            name: "SUV",
            width: 2.0,
            length: 4.8,
            height: 1.8,
            description:
              "Sport utility vehicle with higher clearance, ideal for families.",
            model_path: "/models/suv.glb",
          },
          {
            id: "pickup",
            name: "Pickup Truck",
            width: 2.1,
            length: 5.5,
            height: 1.9,
            description:
              "Utility vehicle with open cargo area, requires larger parking space.",
            model_path: "/models/pickup.glb",
          },
          {
            id: "van",
            name: "Van",
            width: 2.1,
            length: 5.2,
            height: 2.1,
            description:
              "Larger vehicle for transporting people or cargo, needs adequate clearance.",
            model_path: "/models/van.glb",
          },
        ],
      };
    }
  },

  // 获取目的地列表
  getDestinations: async () => {
    try {
      const response = await apiClient.get("/destinations");
      return response.data;
    } catch (error) {
      console.error("Error fetching destinations:", error);

      // 使用备用模拟数据
      return {
        status: "success",
        data: [
          {
            id: "auckland_uni",
            name: "University of Auckland",
            category: "Education",
            address: "22 Princes St, Auckland CBD",
            description:
              "New Zealand's largest university with over 40,000 students, located in the heart of Auckland city.",
            location: { lat: -36.852, lng: 174.768 },
            image: "/maps/destinations/auckland_uni.jpg",
          },
          {
            id: "auckland_hospital",
            name: "Auckland City Hospital",
            category: "Medical",
            address: "2 Park Rd, Grafton",
            description:
              "New Zealand's largest public hospital, providing a wide range of healthcare services.",
            location: { lat: -36.86, lng: 174.77 },
            image: "/maps/destinations/auckland_hospital.jpg",
          },
          {
            id: "auckland_museum",
            name: "Auckland War Memorial Museum",
            category: "Tourism/Entertainment",
            address: "Auckland Domain, Parnell",
            description:
              "One of New Zealand's most important museums and war memorials, with significant Māori and Pacific collections.",
            location: { lat: -36.86, lng: 174.778 },
            image: "/maps/destinations/auckland_museum.jpg",
          },
          {
            id: "britomart",
            name: "Britomart Transport Centre",
            category: "Transport",
            address: "8-10 Queen St, Auckland CBD",
            description:
              "Auckland's main transport hub connecting trains, buses and ferries for the city.",
            location: { lat: -36.844, lng: 174.768 },
            image: "/maps/destinations/britomart.jpg",
          },
          {
            id: "sky_tower",
            name: "Sky Tower",
            category: "Tourism/Entertainment",
            address: "Victoria St W, Auckland CBD",
            description:
              "Iconic 328-meter tall tower offering panoramic views of Auckland city and harbor.",
            location: { lat: -36.848, lng: 174.762 },
            image: "/maps/destinations/sky_tower.jpg",
          },
          {
            id: "mission_bay",
            name: "Mission Bay Beach",
            category: "Beach/Leisure",
            address: "Tamaki Dr, Mission Bay",
            description:
              "Popular urban beach with golden sand and a vibrant promenade lined with cafes and restaurants.",
            location: { lat: -36.848, lng: 174.83 },
            image: "/maps/destinations/mission_bay.jpg",
          },
          {
            id: "sylvia_park",
            name: "Sylvia Park Shopping Centre",
            category: "Shopping",
            address: "286 Mt Wellington Hwy",
            description:
              "New Zealand's largest shopping center with over 200 stores and entertainment options.",
            location: { lat: -36.917, lng: 174.842 },
            image: "/maps/destinations/sylvia_park.jpg",
          },
        ],
      };
    }
  },

  // 获取附近停车场
  getNearbyParkings: async (destination) => {
    try {
      const response = await apiClient.get(
        `/nearby-parkings/${destination.id}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching nearby parkings:", error);

      // 使用备用模拟数据
      return [
        {
          id: "parking_1",
          name: `${destination.name} Parking A`,
          location: {
            lat: destination.location.lat + 0.002,
            lng: destination.location.lng + 0.003,
          },
          distance_to_destination: Math.floor(Math.random() * 200) + 100,
          available_spots: Math.floor(Math.random() * 30) + 5,
          total_spots: Math.floor(Math.random() * 50) + 40,
          hourly_rate: (Math.random() * 5 + 5).toFixed(2),
        },
        {
          id: "parking_2",
          name: `Downtown ${destination.name} Parking`,
          location: {
            lat: destination.location.lat - 0.001,
            lng: destination.location.lng + 0.001,
          },
          distance_to_destination: Math.floor(Math.random() * 200) + 150,
          available_spots: Math.floor(Math.random() * 20) + 3,
          total_spots: Math.floor(Math.random() * 40) + 30,
          hourly_rate: (Math.random() * 4 + 3).toFixed(2),
        },
        {
          id: "parking_3",
          name: `${destination.name} Premier Parking`,
          location: {
            lat: destination.location.lat + 0.001,
            lng: destination.location.lng - 0.002,
          },
          distance_to_destination: Math.floor(Math.random() * 300) + 200,
          available_spots: Math.floor(Math.random() * 15) + 2,
          total_spots: Math.floor(Math.random() * 30) + 20,
          hourly_rate: (Math.random() * 6 + 8).toFixed(2),
        },
      ];
    }
  },

  // 获取停车场详情
  getParkingLotDetails: async (parkingId) => {
    try {
      const response = await apiClient.get(`/parking-lot/${parkingId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching parking lot details:", error);

      // 使用备用模拟数据 - 生成动态停车场
      const rows = 6;
      const cols = 10;

      // 生成停车位
      const spots = {};
      const spotTypes = [
        "standard",
        "compact",
        "large",
        "disabled",
        "ev_charging",
      ];
      const occupiedSpotsCount = Math.floor(
        Math.random() * (rows * cols * 0.7)
      ); // 最大70%占用率
      const occupiedSpots = new Set();

      // 生成随机占用的停车位
      while (occupiedSpots.size < occupiedSpotsCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const spotId = `${String.fromCharCode(65 + row)}${col + 1}`;
        occupiedSpots.add(spotId);
      }

      // 创建所有停车位
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const spotId = `${String.fromCharCode(65 + row)}${col + 1}`;
          const spotType =
            spotTypes[Math.floor(Math.random() * spotTypes.length)];

          spots[spotId] = {
            id: spotId,
            row: row,
            col: col,
            is_occupied: occupiedSpots.has(spotId),
            type: spotType,
            size:
              spotType === "compact"
                ? [2, 4]
                : spotType === "large"
                ? [3, 6]
                : [2.5, 5],
          };
        }
      }

      // 为残疾人专用停车位和电动车充电停车位预留特定位置
      // 残疾人停车位通常靠近入口
      const disabledSpotIds = ["A1", "A2"];
      disabledSpotIds.forEach((id) => {
        if (spots[id]) {
          spots[id].type = "disabled";
          spots[id].is_occupied = Math.random() > 0.7; // 30%概率空闲
        }
      });

      // 电动车充电停车位
      const evSpotIds = ["B1", "B2", "C1"];
      evSpotIds.forEach((id) => {
        if (spots[id]) {
          spots[id].type = "ev_charging";
          spots[id].is_occupied = Math.random() > 0.5; // 50%概率空闲
        }
      });

      // 寻找可用停车位
      const availableSpots = Object.values(spots).filter(
        (spot) => !spot.is_occupied
      );

      // 根据机器学习算法推荐最佳停车位
      // 实际项目中，这应该在后端基于多个因素计算
      let recommendedSpot = null;
      if (availableSpots.length > 0) {
        recommendedSpot =
          availableSpots[Math.floor(Math.random() * availableSpots.length)];
      }

      const aiReasoning = `基于您的${
        parkingId.includes("Premium") ? "高级" : "标准"
      }车型和当前停车位可用情况，推荐您使用${
        recommendedSpot?.id || "无"
      }号车位。该位置到出口距离最佳，且尺寸适合您的车辆。`;

      // 导航指令
      const navigationInstructions = [
        "从正门进入停车场",
        `驶向第1层，${recommendedSpot ? recommendedSpot.row + 1 : ""}排`,
        `寻找${recommendedSpot?.id || ""}号车位`,
        "请在线内小心停车",
      ];

      // 直接返回对象结构，而不是包装在data字段中
      return {
        id: parkingId,
        name: `${parkingId} 停车场`,
        total_spots: rows * cols,
        available_spots: rows * cols - occupiedSpotsCount,
        spots: spots,
        recommended_spot: recommendedSpot,
        ai_reasoning: aiReasoning,
        navigation_instructions: navigationInstructions,
      };
    }
  },

  // 获取AI推荐
  getAiRecommendation: async (data) => {
    try {
      // 实际项目中，这里应该调用后端 API
      // const response = await apiClient.post('/parking/recommendation', data);
      // return response.data;

      // 模拟 API 响应
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 创建一个模拟数据对象
      const mockRecommendation = {
        data: {
          id: "spot1",
          name: "智能推荐停车场",
          location: {
            lat: data.destination.location.lat + 0.001,
            lng: data.destination.location.lng - 0.0015,
          },
          price: "¥4/小时",
          availableSpots: 5,
          distance: "距入口120米",
          isCovered: true,
          security: "24小时监控",
          rating: 4.5,
          isRecommended: true,
          aiReason: "根据您的低成本和靠近入口的偏好，这是最佳选择",
        },
      };

      return mockRecommendation;
    } catch (error) {
      console.error("AI推荐调用失败:", error);
      throw error;
    }
  },

  // 认证相关
  login: (credentials) => apiClient.post("/auth/login", credentials),
  register: (userData) => apiClient.post("/auth/register", userData),
  logout: () => apiClient.post("/auth/logout"),
  refreshToken: () => apiClient.post("/auth/refresh-token"),

  // 用户相关
  getUserProfile: () => apiClient.get("/users/profile"),
  updateUserProfile: (data) => apiClient.put("/users/profile", data),

  // 其他API方法可以根据需求添加
};

export default api;

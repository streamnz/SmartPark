// FrontEnd/src/services/api.js
import axios from "axios";

// API基础URL - 在生产环境应更新为实际后端URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// 创建API客户端
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

      const aiReasoning = `Based on your ${
        parkingId.includes("Premium") ? "premium" : "standard"
      } vehicle type and current parking availability, spot ${
        recommendedSpot?.id || "None"
      } is recommended. This location offers optimal distance to exit and suitable dimensions for your vehicle.`;

      // 导航指令
      const navigationInstructions = [
        "Enter parking lot from the main entrance",
        `Drive to level 1, ${
          recommendedSpot ? recommendedSpot.row + 1 : ""
        } row`,
        `Look for spot ${recommendedSpot?.id || ""}`,
        "Park carefully within the lines",
      ];

      return {
        id: parkingId,
        name: `${parkingId} Parking Lot`,
        total_spots: rows * cols,
        available_spots: rows * cols - occupiedSpotsCount,
        spots: spots,
        recommended_spot: recommendedSpot,
        ai_reasoning: aiReasoning,
        navigation_instructions: navigationInstructions,
      };
    }
  },

  // 获取停车推荐
  getParkingRecommendation: async (parkingId, vehicleType) => {
    try {
      const response = await apiClient.post(
        `/parking-recommendation/${parkingId}`,
        {
          vehicle_type: vehicleType,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching parking recommendation:", error);

      // 重用停车场详情获取的逻辑
      const parkingLot = await api.getParkingLotDetails(parkingId);

      return {
        status: "success",
        spot: parkingLot.recommended_spot,
        reasoning: parkingLot.ai_reasoning,
        navigation_instructions: parkingLot.navigation_instructions,
      };
    }
  },

  // 请求重新路由
  requestReroute: async (parkingId, currentPosition, recommendedSpot) => {
    try {
      const response = await apiClient.post(`/reroute/${parkingId}`, {
        current_position: currentPosition,
        recommended_spot: recommendedSpot,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error rerouting:", error);

      // 使用备用模拟数据
      // 获取停车场数据
      const parkingLot = await api.getParkingLotDetails(parkingId);

      // 查找可用停车位
      const availableSpots = Object.values(parkingLot.spots).filter(
        (spot) => !spot.is_occupied && spot.id !== recommendedSpot.id
      );

      // 转换当前位置到行和列
      const currentRow = Math.round(currentPosition.y);
      const currentCol = Math.round(currentPosition.x);

      // 按到当前位置的距离排序
      const sortedSpots = [...availableSpots].sort((a, b) => {
        const distA =
          Math.abs(a.row - currentRow) + Math.abs(a.col - currentCol);
        const distB =
          Math.abs(b.row - currentRow) + Math.abs(b.col - currentCol);
        return distA - distB;
      });

      // 选择最近的停车位
      const recommendation = {
        status: "success",
        spot: sortedSpots[0],
        reasoning:
          "Based on your current position, a new parking spot has been recommended",
        navigation_instructions: [
          "From your current position",
          `Drive ${
            sortedSpots[0].row > currentRow ? "forward" : "backward"
          } ${Math.abs(sortedSpots[0].row - currentRow)} rows`,
          `Drive ${
            sortedSpots[0].col > currentCol ? "right" : "left"
          } ${Math.abs(sortedSpots[0].col - currentCol)} columns`,
          `This is your spot ${sortedSpots[0].id}`,
        ],
      };

      return recommendation;
    }
  },

  // 重置停车场
  resetParkingLot: async (parkingId) => {
    try {
      const response = await apiClient.post(`/reset-parking-lot/${parkingId}`);
      return response.data;
    } catch (error) {
      console.error("Error resetting parking lot:", error);
      // 不需要特殊的本地处理，因为数据会在每次获取时重新生成
      return { status: "success", message: "Parking lot has been reset" };
    }
  },
};

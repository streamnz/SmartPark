/**
 * Google Maps & Places API Service
 * 封装Google Maps和Places API的调用
 */

// 记录API是否已加载以避免重复加载
let isApiLoaded = false;
let placesService = null;
let autocompleteService = null;
let mapsDiv = null;

// 从环境变量或硬编码获取API密钥
const getApiKey = () => {
  // 优先使用环境变量中的密钥
  const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (envApiKey) return envApiKey;

  // 如果环境变量不可用，使用硬编码密钥（不推荐，仅作为备份）
  return "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";
};

// 用于模拟数据的函数（仅在API不可用时使用）
const getMockSearchResults = (query) => {
  console.log("使用模拟搜索数据");
  // 模拟搜索结果
  const mockData = [
    {
      place_id: "ChIJwzUyH8JHDW0Rrc0FXW4qmYw",
      description:
        "奥克兰大学 (The University of Auckland), Princes Street, Auckland CBD, 奥克兰, 新西兰",
      structured_formatting: {
        main_text: "奥克兰大学",
        secondary_text: "Princes Street, Auckland CBD, 奥克兰, 新西兰",
      },
    },
    {
      place_id: "ChIJXXNAVMJHDW0RYK3OJm8v0YE",
      description:
        "奥克兰技术大学 (Auckland University of Technology), Mayoral Drive, Auckland CBD, 奥克兰, 新西兰",
      structured_formatting: {
        main_text: "奥克兰技术大学",
        secondary_text: "Mayoral Drive, Auckland CBD, 奥克兰, 新西兰",
      },
    },
  ];

  // 如果查询中包含某些关键词，返回相关的模拟数据
  if (
    query.toLowerCase().includes("college") ||
    query.toLowerCase().includes("大学")
  ) {
    return mockData;
  }

  return [
    {
      place_id: "mock_place_1",
      description: `${query} - 搜索结果1`,
      structured_formatting: {
        main_text: `${query} - 结果1`,
        secondary_text: "Auckland, New Zealand",
      },
    },
    {
      place_id: "mock_place_2",
      description: `${query} - 搜索结果2`,
      structured_formatting: {
        main_text: `${query} - 结果2`,
        secondary_text: "Auckland, New Zealand",
      },
    },
  ];
};

/**
 * 加载Google Maps API脚本
 * @returns {Promise} 加载完成的Promise
 */
export const loadGoogleMapsApi = () => {
  return new Promise((resolve, reject) => {
    // 如果API已加载，直接返回
    if (isApiLoaded && window.google && window.google.maps) {
      console.log("Google Maps API已加载，复用现有实例");
      initServices();
      resolve(window.google.maps);
      return;
    }

    // 避免重复加载
    if (
      document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
    ) {
      console.log("Google Maps API脚本已存在，等待加载完成");

      // 检查是否已经加载完成
      if (window.google && window.google.maps) {
        console.log("Google Maps API已加载完成");
        isApiLoaded = true;
        initServices();
        resolve(window.google.maps);
      } else {
        // 轮询检查直到API加载完成
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            console.log("Google Maps API现已加载完成");
            isApiLoaded = true;
            initServices();
            resolve(window.google.maps);
          }
        }, 100);

        // 设置超时
        setTimeout(() => {
          clearInterval(checkGoogleMaps);
          reject(new Error("Google Maps API加载超时"));
        }, 10000);
      }
      return;
    }

    console.log("开始加载Google Maps API...");

    // 创建回调函数
    const callbackName = `initGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      console.log("Google Maps API回调函数被调用");
      if (window.google && window.google.maps) {
        console.log("Google Maps API加载成功！");
        isApiLoaded = true;
        initServices();
        resolve(window.google.maps);
      } else {
        console.error("Google Maps API加载回调被触发，但google.maps对象不存在");
        reject(new Error("Google Maps API加载异常"));
      }
      delete window[callbackName];
    };

    // 创建script标签
    const script = document.createElement("script");
    const apiKey = getApiKey();
    console.log(`使用API密钥: ${apiKey.substring(0, 8)}...`); // 仅输出密钥前缀，保护安全

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=${callbackName}&v=beta`;
    script.async = true;
    script.defer = true;

    script.onerror = (e) => {
      console.error("Google Maps API脚本加载失败:", e);
      reject(new Error("Google Maps API脚本加载失败，请检查网络和API密钥"));
    };

    document.head.appendChild(script);
  });
};

/**
 * 初始化Google Maps相关服务
 */
const initServices = () => {
  if (!window.google || !window.google.maps) {
    console.error("无法初始化服务：Google Maps未加载");
    return false;
  }

  try {
    console.log("初始化Google Maps服务...");

    // 创建隐藏的div元素作为Maps服务容器
    if (!mapsDiv) {
      mapsDiv = document.createElement("div");
      mapsDiv.style.display = "none";
      document.body.appendChild(mapsDiv);
    }

    // 初始化PlacesService（需要DOM元素）
    if (!placesService) {
      placesService = new window.google.maps.places.PlacesService(mapsDiv);
      console.log("PlacesService初始化成功");
    }

    // 初始化AutocompleteService
    if (!autocompleteService) {
      if (window.google.maps.places.AutocompleteService) {
        autocompleteService =
          new window.google.maps.places.AutocompleteService();
        console.log("AutocompleteService初始化成功");
      } else {
        console.error("AutocompleteService不可用");
      }
    }

    return true;
  } catch (error) {
    console.error("初始化Google Maps服务失败:", error);
    return false;
  }
};

/**
 * 初始化地图服务
 * @returns {Promise} 初始化完成的Promise
 */
export const initMapsService = async () => {
  try {
    const maps = await loadGoogleMapsApi();
    console.log("地图服务初始化成功");
    return maps;
  } catch (error) {
    console.error("地图服务初始化失败:", error);
    throw error;
  }
};

/**
 * 搜索地点并获取建议
 * @param {string} query 搜索查询文本
 * @returns {Promise} 搜索结果Promise
 */
export const searchPlaces = async (query) => {
  console.log(`开始搜索地点: "${query}"`);

  // 如果查询为空，返回空结果
  if (!query || query.trim() === "") {
    console.log("查询为空，返回空结果");
    return [];
  }

  try {
    // 确保API已加载
    if (!isApiLoaded || !autocompleteService) {
      console.log("尝试加载 Google Maps API...");
      try {
        await loadGoogleMapsApi();
      } catch (err) {
        console.error("加载 Google Maps API 失败:", err);
        return getMockSearchResults(query); // 使用模拟数据作为备用
      }
    }

    // 二次检查 autocompleteService
    if (!autocompleteService) {
      console.warn("AutocompleteService 仍不可用，使用模拟数据");
      return getMockSearchResults(query);
    }

    // 使用 AutocompleteService 进行搜索
    return new Promise((resolve) => {
      console.log("调用 AutocompleteService.getPlacePredictions...");

      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "nz" }, // 限制在新西兰
        },
        (predictions, status) => {
          console.log(`AutocompleteService 返回状态: ${status}`);

          // 如果 API 调用成功并返回结果
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions &&
            predictions.length > 0
          ) {
            console.log(`成功找到 ${predictions.length} 个搜索结果`);
            resolve(predictions);
          } else {
            console.warn(`API 未返回结果或出错。状态: ${status}，使用模拟数据`);
            resolve(getMockSearchResults(query));
          }
        }
      );
    });
  } catch (error) {
    console.error("搜索地点时发生错误:", error);
    return getMockSearchResults(query); // 使用模拟数据作为后备
  }
};

/**
 * 获取地点详情
 * @param {string} placeId 地点ID
 * @returns {Promise} 地点详情Promise
 */
export const getPlaceDetails = async (placeId) => {
  // 如果 placeId 以 "mock_" 开头，返回模拟数据
  if (placeId && placeId.startsWith("mock_")) {
    console.log("使用模拟地点详情数据");
    return {
      name: "模拟地点 " + placeId,
      formatted_address: "123 Sample Street, Auckland, New Zealand",
      geometry: {
        location: {
          lat: () => -36.8508,
          lng: () => 174.7645,
        },
      },
      types: ["point_of_interest"],
    };
  }

  // 确保API和服务已初始化
  if (!isApiLoaded || !placesService) {
    console.log("尝试初始化Maps服务后再获取地点详情");
    try {
      await loadGoogleMapsApi();
    } catch (error) {
      console.error("无法加载 Google Maps API:", error);
      throw error;
    }

    // 二次检查
    if (!placesService) {
      console.error("PlacesService初始化失败");
      throw new Error("Places service could not be initialized");
    }
  }

  return new Promise((resolve, reject) => {
    console.log(`获取地点详情: ${placeId}`);
    try {
      placesService.getDetails(
        {
          placeId,
          fields: ["name", "geometry", "formatted_address", "types", "photos"],
        },
        (place, status) => {
          console.log(`获取地点详情状态: ${status}`);
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            console.log(`成功获取地点详情: ${place.name}`);
            resolve(place);
          } else {
            console.error(`获取地点详情失败。状态: ${status}`);
            reject(new Error(`Failed to get place details. Status: ${status}`));
          }
        }
      );
    } catch (error) {
      console.error("调用PlacesService时出错:", error);
      reject(error);
    }
  });
};

/**
 * 将Google地点类型转换为应用程序类别
 * @param {Array} types Google地点类型数组
 * @returns {string} 应用程序类别
 */
export const mapPlaceTypeToCategory = (types) => {
  if (!types || types.length === 0) return "Other";

  if (types.includes("school") || types.includes("university")) {
    return "Education";
  } else if (types.includes("hospital") || types.includes("doctor")) {
    return "Medical";
  } else if (types.includes("shopping_mall") || types.includes("store")) {
    return "Shopping";
  } else if (types.includes("restaurant") || types.includes("cafe")) {
    return "Leisure/Dining";
  } else if (types.includes("park")) {
    return "Parks";
  } else if (types.includes("tourist_attraction")) {
    return "Tourism/Entertainment";
  } else if (types.includes("transit_station")) {
    return "Transport";
  }

  return "Other";
};

export default {
  loadGoogleMapsApi,
  searchPlaces,
  getPlaceDetails,
  mapPlaceTypeToCategory,
};

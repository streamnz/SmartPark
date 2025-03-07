/**
 * Google Maps & Places API Service
 * 封装Google Maps和Places API的调用
 */

// 记录API是否已加载以避免重复加载
let isApiLoaded = false;
let placesService = null;
let autocompleteService = null;
let mapsDiv = null;

// Track API loading state
let isApiLoading = false;
let apiLoadingPromise = null;

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
 * Load Google Maps API with all required libraries
 * @returns {Promise} - Promise that resolves when API is loaded
 */
const loadGoogleMapsApi = () => {
  // If we already have a promise in progress, return it
  if (apiLoadingPromise) {
    return apiLoadingPromise;
  }

  // If API is already loaded, return resolved promise
  if (window.google && window.google.maps && window.google.maps.places) {
    console.log("Google Maps API already loaded");
    return Promise.resolve(window.google.maps);
  }

  // Create new loading promise
  apiLoadingPromise = new Promise((resolve, reject) => {
    // Set loading flag
    isApiLoading = true;

    // Check if script already exists
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      console.log("Google Maps script already exists, waiting for it to load");

      // Set up interval to check for API loading completion
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          console.log("Google Maps API loaded successfully (existing script)");
          isApiLoading = false;
          resolve(window.google.maps);
        }
      }, 100);

      // Set timeout to avoid waiting forever
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        isApiLoading = false;
        apiLoadingPromise = null;
        reject(new Error("Google Maps API loading timeout"));
      }, 15000);

      return;
    }

    // Create script element
    const script = document.createElement("script");
    script.id = "google-maps-script";

    // Get API key from environment variables
    const apiKey =
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";

    // Define callback function
    const callbackName = `googleMapsCallback_${Date.now()}`;
    window[callbackName] = () => {
      console.log("Google Maps callback executed");
      if (window.google && window.google.maps && window.google.maps.places) {
        isApiLoading = false;
        delete window[callbackName];
        resolve(window.google.maps);
      } else {
        console.error("Google Maps callback executed but API not available");
        setTimeout(() => {
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.places
          ) {
            isApiLoading = false;
            delete window[callbackName];
            resolve(window.google.maps);
          } else {
            isApiLoading = false;
            apiLoadingPromise = null;
            delete window[callbackName];
            reject(new Error("Google Maps API failed to initialize properly"));
          }
        }, 1000); // Give it a second chance
      }
    };

    // Set script attributes - explicitly include places library
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;

    // Handle script loading errors
    script.onerror = (error) => {
      console.error("Error loading Google Maps script:", error);
      isApiLoading = false;
      apiLoadingPromise = null;
      delete window[callbackName];
      reject(new Error("Failed to load Google Maps script"));
    };

    // Set timeout to handle cases where callback isn't called
    const timeout = setTimeout(() => {
      if (isApiLoading) {
        console.error("Google Maps script loading timeout");
        isApiLoading = false;
        apiLoadingPromise = null;
        delete window[callbackName];
        reject(new Error("Google Maps API loading timeout"));
      }
    }, 15000);

    // Add script to head
    document.head.appendChild(script);
  });

  // Handle promise completion to reset loading state
  apiLoadingPromise.catch(() => {
    apiLoadingPromise = null;
  });

  return apiLoadingPromise;
};

/**
 * 确保Google Maps API加载后才执行操作
 * @returns {Promise} 加载完成的Promise
 */
export const ensureApiLoaded = async () => {
  try {
    return await loadGoogleMapsApi();
  } catch (error) {
    console.error("加载Google Maps API失败:", error);
    throw error;
  }
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
 * Search for places using the Google Places API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of search results
 */
const searchPlaces = async (query) => {
  if (!query || query.trim() === "") {
    return [];
  }

  try {
    // Ensure API is loaded
    await ensureApiLoaded();

    // Double-check Places API exists
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error("Places API not available despite load success");
      return getMockSearchResults(query);
    }

    // Create AutocompleteService instance
    const autocompleteService =
      new window.google.maps.places.AutocompleteService();

    // Return promise for results
    return new Promise((resolve) => {
      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "nz" },
        },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            resolve(results);
          } else {
            console.warn(`Places search failed with status: ${status}`);
            resolve(getMockSearchResults(query));
          }
        }
      );
    });
  } catch (error) {
    console.error("Error in searchPlaces:", error);
    return getMockSearchResults(query);
  }
};

/**
 * Get place details using Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details
 */
const getPlaceDetails = async (placeId) => {
  console.log(`获取地点详情，placeId: ${placeId}`);

  // Return mock data for mock places
  if (placeId && placeId.startsWith("mock_place")) {
    return {
      id: placeId,
      name: `Mock Place ${placeId.split("_")[2]}`,
      address: "123 Mock Street, Auckland, New Zealand",
      location: { lat: -36.8485, lng: 174.7633 },
      category: "Other",
    };
  }

  try {
    // Ensure API is loaded
    await ensureApiLoaded();
    console.log("Maps API已加载，准备获取地点详情");

    // Need a HTML element for PlacesService
    let placesDiv = document.getElementById("places-service-container");
    if (!placesDiv) {
      placesDiv = document.createElement("div");
      placesDiv.id = "places-service-container";
      placesDiv.style.display = "none";
      document.body.appendChild(placesDiv);
    }

    // Create PlacesService instance
    const placesService = new window.google.maps.places.PlacesService(
      placesDiv
    );

    // Return promise for details
    return new Promise((resolve, reject) => {
      console.log("调用PlacesService.getDetails...");
      placesService.getDetails(
        {
          placeId: placeId,
          fields: ["name", "formatted_address", "geometry", "types"],
        },
        (result, status) => {
          console.log(`PlacesService.getDetails 返回状态: ${status}`);

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            result
          ) {
            console.log("成功获取地点详情:", result);

            // Format the result
            const formattedResult = {
              id: result.place_id,
              name: result.name,
              address: result.formatted_address,
              location: result.geometry?.location
                ? {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng(),
                  }
                : null,
              category: result.types
                ? getCategoryFromTypes(result.types)
                : "Other",
            };

            console.log("格式化后的地点详情:", formattedResult);
            resolve(formattedResult);
          } else {
            console.error(`获取地点详情失败，状态: ${status}`);
            reject(new Error(`Failed to get place details: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error("获取地点详情时出错:", error);
    throw error;
  }
};

/**
 * Map Google place types to app categories
 * @param {Array<string>} types - Google place types
 * @returns {string} - Mapped category
 */
const getCategoryFromTypes = (types) => {
  if (types.includes("school") || types.includes("university")) {
    return "Education";
  } else if (
    types.includes("hospital") ||
    types.includes("doctor") ||
    types.includes("health")
  ) {
    return "Medical";
  } else if (types.includes("store") || types.includes("shopping_mall")) {
    return "Shopping";
  } else if (
    types.includes("restaurant") ||
    types.includes("cafe") ||
    types.includes("bar")
  ) {
    return "Leisure/Dining";
  } else if (types.includes("park") || types.includes("natural_feature")) {
    return "Parks";
  } else if (types.includes("tourist_attraction") || types.includes("museum")) {
    return "Tourism/Entertainment";
  } else if (types.includes("transit_station") || types.includes("airport")) {
    return "Transport";
  }
  return "Other";
};

export default {
  loadGoogleMapsApi,
  ensureApiLoaded,
  searchPlaces,
  getPlaceDetails,
  getCategoryFromTypes,
};

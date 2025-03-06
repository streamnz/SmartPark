/**
 * 环境变量工具函数
 */

// 验证并获取环境变量
export const getEnv = (key, fallback = "") => {
  const value = import.meta.env[key];

  // 检查环境变量是否存在
  if (value === undefined || value === null || value === "") {
    console.warn(
      `Environment variable ${key} is not defined. Using fallback value.`
    );
    return fallback;
  }

  return value;
};

// 导出常用环境变量
export const ENV = {
  GOOGLE_MAPS_API_KEY: getEnv("VITE_GOOGLE_MAPS_API_KEY", ""),
  API_BASE_URL: getEnv("VITE_API_BASE_URL", "http://localhost:5001/api"),
};

// 验证关键环境变量
export const validateEnv = () => {
  const missing = [];

  if (!ENV.GOOGLE_MAPS_API_KEY) missing.push("VITE_GOOGLE_MAPS_API_KEY");
  if (!ENV.API_BASE_URL) missing.push("VITE_API_BASE_URL");

  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    return false;
  }

  return true;
};

// 输出可用环境变量
export const logAvailableEnv = () => {
  console.log("Available environment variables:");
  console.log("================================");
  Object.keys(import.meta.env).forEach((key) => {
    // 隐藏敏感信息
    if (
      key.includes("KEY") ||
      key.includes("SECRET") ||
      key.includes("PASSWORD")
    ) {
      console.log(`${key}: ${import.meta.env[key].substring(0, 4)}...`);
    } else {
      console.log(`${key}: ${import.meta.env[key]}`);
    }
  });
  console.log("================================");
};

export default {
  getEnv,
  ENV,
  validateEnv,
  logAvailableEnv,
};

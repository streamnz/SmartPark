// 如果文件存在，修改API基础URL
const getBaseUrl = () => {
  const domain = window.location.origin;
  if (domain.includes("localhost")) {
    return "http://localhost:5001/api";
  } else if (domain.includes("smartpark.streamnz.com")) {
    return "https://smartparking-api.streamnz.com/api"; // 修正为正确的API域名
  } else {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  }
};

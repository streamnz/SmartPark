import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());

  console.log("Loading environment variables...");
  console.log(
    "VITE_GOOGLE_MAPS_API_KEY exists:",
    !!env.VITE_GOOGLE_MAPS_API_KEY
  );

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    define: {
      // 确保环境变量可用
      "process.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        env.VITE_GOOGLE_MAPS_API_KEY
      ),
    },
  };
});

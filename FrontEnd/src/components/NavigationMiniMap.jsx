import React, { useRef, useEffect } from "react";
import { Box } from "@mui/material";

/**
 * 停车场小地图导航组件
 * 显示停车场俯视视图、当前车辆位置和导航路径
 *
 * @param {Array} parkingLayout - 停车场布局信息，包含位置和状态
 * @param {Array} carPosition - 车辆位置 [x, z]
 * @param {number} carRotation - 车辆朝向（弧度）
 * @param {Array} navigationPath - 导航路径点数组
 * @param {number} progress - 导航进度 (0-100)
 */
const NavigationMiniMap = ({
  parkingLayout = [],
  carPosition = [0, 0],
  carRotation = 0,
  navigationPath = [],
  progress = 0,
}) => {
  const canvasRef = useRef(null);

  // 绘制小地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // 设置比例和偏移以适应停车场到小地图
    const scale = 5; // 缩放比例
    const offsetX = width / 2;
    const offsetY = height / 2;

    // 绘制网格
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;

    for (let x = -20; x <= 20; x += 5) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * scale, 0);
      ctx.lineTo(offsetX + x * scale, height);
      ctx.stroke();
    }

    for (let y = -20; y <= 20; y += 5) {
      ctx.beginPath();
      ctx.moveTo(0, offsetY + y * scale);
      ctx.lineTo(width, offsetY + y * scale);
      ctx.stroke();
    }

    // 绘制停车位
    parkingLayout.forEach((spot) => {
      const x = offsetX + spot.position[0] * scale;
      const y = offsetY + spot.position[1] * scale;
      const width = spot.size[0] * scale;
      const height = spot.size[1] * scale;

      // 根据状态选择颜色
      if (spot.isOccupied) {
        ctx.fillStyle = "rgba(255, 65, 54, 0.6)"; // 已占用
      } else if (spot.isRecommended) {
        ctx.fillStyle = "rgba(46, 204, 64, 0.6)"; // 推荐
      } else {
        ctx.fillStyle = "rgba(0, 116, 217, 0.6)"; // 可用
      }

      ctx.fillRect(x - width / 2, y - height / 2, width, height);

      // 添加车位编号
      if (spot.isRecommended) {
        ctx.fillStyle = "#fff";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(spot.id, x, y);
      }
    });

    // 绘制导航路径
    if (navigationPath.length > 1) {
      ctx.strokeStyle = "#FFDC00";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 2]);
      ctx.beginPath();

      navigationPath.forEach((point, index) => {
        const x = offsetX + point[0] * scale;
        const y = offsetY + point[1] * scale;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 计算当前导航位置
    if (navigationPath.length > 1 && progress > 0) {
      const pathLength = navigationPath.length - 1;
      const currentIndex = Math.min(
        Math.floor((progress / 100) * pathLength),
        pathLength - 1
      );
      const nextIndex = currentIndex + 1;
      const segmentProgress = ((progress / 100) * pathLength) % 1;

      const currentPoint = navigationPath[currentIndex];
      const nextPoint = navigationPath[nextIndex];

      // 绘制当前位置的进度点
      if (currentPoint && nextPoint) {
        const x =
          offsetX +
          (currentPoint[0] +
            (nextPoint[0] - currentPoint[0]) * segmentProgress) *
            scale;
        const y =
          offsetY +
          (currentPoint[1] +
            (nextPoint[1] - currentPoint[1]) * segmentProgress) *
            scale;

        ctx.fillStyle = "#FF851B";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 绘制车辆
    const carX = offsetX + carPosition[0] * scale;
    const carY = offsetY + carPosition[1] * scale;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(carRotation);

    // 绘制车辆三角形图标
    ctx.fillStyle = "#01FF70";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-3, 3);
    ctx.lineTo(3, 3);
    ctx.closePath();
    ctx.fill();

    // 还原画布状态
    ctx.restore();

    // 绘制小地图边框
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // 添加小地图标题
    ctx.fillStyle = "#fff";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("停车场导航", width / 2, 4);
  }, [parkingLayout, carPosition, carRotation, navigationPath, progress]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  );
};

export default NavigationMiniMap;

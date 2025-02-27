import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import DirectionsIcon from "@mui/icons-material/Directions";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Vehicle3D from "./Vehicle3D";
import ParkingConsole from "../components/ParkingConsole";

// 停车位组件
const ParkingSpot = ({ position, size, isOccupied, isRecommended, type }) => {
  // 根据停车位类型确定颜色
  const getSpotColor = () => {
    if (isRecommended) return "#4caf50";
    if (isOccupied) return "#f44336";

    switch (type) {
      case "disabled":
        return "#9c27b0";
      case "ev_charging":
        return "#03a9f4";
      case "compact":
        return "#ff9800";
      case "large":
        return "#795548";
      default:
        return "#757575";
    }
  };

  return (
    <mesh position={position}>
      <boxGeometry args={[size[0], 0.1, size[1]]} />
      <meshStandardMaterial color={getSpotColor()} />
    </mesh>
  );
};

// 地面组件
const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
  );
};

// 道路组件
const Road = ({ position, size }) => {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  );
};

// 停车场3D场景
const ParkingLot3DScene = ({
  parkingLotData,
  vehicle,
  recommendedSpot,
  aiReasoning,
  navigationInstructions,
  onParkingSuccess,
}) => {
  const [vehiclePosition, setVehiclePosition] = useState([10, 0, 15]);
  const [isParked, setIsParked] = useState(false);
  const [isNearRecommended, setIsNearRecommended] = useState(false);
  const [rerouteCount, setRerouteCount] = useState(0);
  const controlsEnabled = useRef(true);
  const keyStates = useRef({});
  const sceneRef = useRef(null);

  // 键盘控制初始化
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!controlsEnabled.current) return;
      keyStates.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keyStates.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 检查是否接近推荐停车位
  useEffect(() => {
    if (recommendedSpot && !isParked) {
      const spotPosition = [
        recommendedSpot.col * 3,
        0,
        recommendedSpot.row * 3,
      ];

      const distanceToSpot = Math.sqrt(
        Math.pow(vehiclePosition[0] - spotPosition[0], 2) +
          Math.pow(vehiclePosition[2] - spotPosition[2], 2)
      );

      // 如果距离小于1.5个单位，则认为接近停车位
      if (distanceToSpot < 1.5) {
        setIsNearRecommended(true);

        // 如果距离足够近，则认为已停车
        if (distanceToSpot < 0.8) {
          setIsParked(true);
          controlsEnabled.current = false;

          // 通知父组件停车成功
          setTimeout(() => {
            onParkingSuccess();
          }, 2000);
        }
      } else {
        setIsNearRecommended(false);
      }
    }
  }, [vehiclePosition, recommendedSpot, isParked, onParkingSuccess]);

  // 处理重新路由
  const handleRerouteRequest = () => {
    setRerouteCount((prev) => prev + 1);
    // 在真实应用中，这里会调用API获取新的路线
    alert("Route recalculated. Follow the new navigation instructions.");
  };

  // 停车场3D场景内的动画帧
  const Animations = () => {
    const { camera } = useThree();

    useFrame(() => {
      if (!controlsEnabled.current) return;

      // 移动速度
      const moveSpeed = 0.1;
      // 旋转速度
      const rotSpeed = 0.02;

      // 临时变量存储新位置
      let newX = vehiclePosition[0];
      let newZ = vehiclePosition[2];
      let moved = false;

      // 前进
      if (keyStates.current["w"]) {
        newX -= moveSpeed * Math.sin(camera.rotation.y);
        newZ -= moveSpeed * Math.cos(camera.rotation.y);
        moved = true;
      }

      // 后退
      if (keyStates.current["s"]) {
        newX += moveSpeed * Math.sin(camera.rotation.y);
        newZ += moveSpeed * Math.cos(camera.rotation.y);
        moved = true;
      }

      // 左移
      if (keyStates.current["a"]) {
        newX -= moveSpeed * Math.cos(camera.rotation.y);
        newZ += moveSpeed * Math.sin(camera.rotation.y);
        moved = true;
      }

      // 右移
      if (keyStates.current["d"]) {
        newX += moveSpeed * Math.cos(camera.rotation.y);
        newZ -= moveSpeed * Math.sin(camera.rotation.y);
        moved = true;
      }

      // 检查边界
      newX = Math.max(-30, Math.min(30, newX));
      newZ = Math.max(-30, Math.min(30, newZ));

      // 更新位置
      if (moved) {
        setVehiclePosition([newX, vehiclePosition[1], newZ]);
      }
    });

    return null;
  };

  // 渲染停车场地图
  const renderParkingLotMap = () => {
    if (!parkingLotData) return null;

    const spots = [];

    // 遍历停车位
    Object.values(parkingLotData.spots).forEach((spot) => {
      const isRecommendedSpot =
        recommendedSpot && spot.id === recommendedSpot.id;

      spots.push(
        <ParkingSpot
          key={spot.id}
          position={[spot.col * 3, 0, spot.row * 3]}
          size={[2.5, 5]}
          isOccupied={spot.is_occupied}
          isRecommended={isRecommendedSpot}
          type={spot.type}
        />
      );
    });

    return spots;
  };

  return (
    <Box sx={{ position: "relative", height: 600, width: "100%" }}>
      <Canvas
        ref={sceneRef}
        camera={{ position: [0, 10, 20], fov: 60 }}
        className="three-scene"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <directionalLight position={[-10, 10, 5]} intensity={0.5} />

        <Animations />
        <Ground />

        {/* 道路网络 */}
        <Road position={[0, 0, 0]} size={[60, 60]} />

        {/* 停车位 */}
        {renderParkingLotMap()}

        {/* 车辆 */}
        <Vehicle3D vehicleType={vehicle.id} position={vehiclePosition} />

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={5}
          maxDistance={25}
        />
      </Canvas>

      <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
        <ParkingConsole
          recommendedSpot={recommendedSpot}
          aiReasoning={aiReasoning}
          navigationInstructions={navigationInstructions}
          currentPosition={vehiclePosition}
          isNearRecommended={isNearRecommended}
          onRerouteRequest={handleRerouteRequest}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          width: 260,
        }}
      >
        <Card sx={{ bgcolor: "rgba(0, 0, 0, 0.7)", color: "white" }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              AI Recommendation:
            </Typography>
            <Typography variant="body2">{aiReasoning}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 停车成功消息 */}
      {isParked && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "rgba(76, 175, 80, 0.9)",
            color: "white",
            p: 3,
            borderRadius: 2,
            textAlign: "center",
            zIndex: 20,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60 }} />
          <Typography variant="h5" sx={{ mt: 2 }}>
            Parking Successful!
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            You successfully parked in spot {recommendedSpot.id}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          bgcolor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          py: 1,
          px: 2,
          borderRadius: 1,
        }}
      >
        <Typography variant="body2">
          Controls: W, A, S, D to drive. Use mouse to rotate camera.
        </Typography>
      </Box>
    </Box>
  );
};

export default ParkingLot3DScene;

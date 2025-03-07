import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  Sky,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Box, Typography, Paper, CircularProgress, Fab } from "@mui/material";
import { Physics, useBox, usePlane } from "@react-three/cannon";
import * as THREE from "three";
import NavigationMiniMap from "./NavigationMiniMap";
import {
  CameraAlt,
  DirectionsCar,
  ArrowUpward,
  ArrowBack,
} from "@mui/icons-material";

// 车辆模型组件
const Car = ({ position, rotation, modelPath, scale = 0.01, isMoving }) => {
  const { scene } = useGLTF(modelPath || "/models/sedan.glb");
  const ref = useRef();

  // 复制模型以避免修改原始模型
  const copiedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (ref.current) {
      // 设置车辆位置
      ref.current.position.set(position[0], position[1], position[2]);
      // 设置车辆旋转
      ref.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [position, rotation]);

  return (
    <primitive
      ref={ref}
      object={copiedScene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
};

// 停车场地面
const Ground = ({ size = [100, 100] }) => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#333" />
      <gridHelper args={[100, 100, "#666", "#444"]} position={[0, 0.01, 0]} />
    </mesh>
  );
};

// 停车位
const ParkingSpot = ({
  position,
  size,
  id,
  isOccupied,
  isRecommended,
  onClick,
}) => {
  const color = isOccupied ? "#FF4136" : isRecommended ? "#2ECC40" : "#7FDBFF";

  return (
    <mesh
      position={[position[0], 0.01, position[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={onClick}
    >
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial color={color} transparent opacity={0.7} />
      <Html position={[0, 0, 0.1]} center>
        <div
          style={{
            color: "white",
            background: "rgba(0,0,0,0.5)",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "0.7rem",
            fontWeight: "bold",
          }}
        >
          {id}
        </div>
      </Html>
    </mesh>
  );
};

// 自动驾驶路径
const DrivingPath = ({ path, progress }) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current || !path || path.length < 2) return;

    // 创建曲线
    const curve = new THREE.CatmullRomCurve3(
      path.map((point) => new THREE.Vector3(point[0], 0.1, point[1]))
    );

    // 创建几何体
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // 更新ref中的几何体
    ref.current.geometry = geometry;
  }, [path]);

  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="#FFDC00" linewidth={2} />
    </line>
  );
};

// 第一人称视角控制
const FirstPersonCamera = ({ carPosition, carRotation, isFirstPerson }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!isFirstPerson) return;

    // 计算车辆前方位置作为相机位置
    const offset = new THREE.Vector3(0, 1.2, 0); // 车内视角高度
    const position = new THREE.Vector3(
      carPosition[0],
      carPosition[1] + offset.y,
      carPosition[2]
    );

    // 应用车辆旋转
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(new THREE.Euler(0, carRotation[1], 0));

    // 设置相机位置和朝向
    camera.position.copy(position);
    camera.lookAt(
      new THREE.Vector3(
        position.x + direction.x,
        position.y + direction.y,
        position.z + direction.z
      )
    );
  }, [camera, carPosition, carRotation, isFirstPerson]);

  return null;
};

// 方向提示UI
const DirectionUI = ({ nextDirection }) => {
  let DirectionIcon;
  let label = "";

  switch (nextDirection) {
    case "forward":
      DirectionIcon = ArrowUpward;
      label = "前进";
      break;
    case "left":
      DirectionIcon = ArrowBack;
      label = "左转";
      break;
    case "right":
      DirectionIcon = ArrowBack;
      label = "右转";
      break;
    default:
      return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 1,
        borderRadius: 2,
        bgcolor: "rgba(0,0,0,0.7)",
        color: "white",
        zIndex: 10,
      }}
    >
      <DirectionIcon
        sx={{
          fontSize: "2.5rem",
          transform:
            nextDirection === "right"
              ? "rotate(90deg)"
              : nextDirection === "left"
              ? "rotate(-90deg)"
              : "none",
        }}
      />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
};

// 主停车场模拟器组件
const ParkingSimulator = ({
  parkingLotData,
  selectedVehicle,
  onParkingComplete,
  aiRecommendation,
}) => {
  const [carPosition, setCarPosition] = useState([0, 0.1, 15]); // 起始位置
  const [carRotation, setCarRotation] = useState([0, 0, 0]);
  const [path, setPath] = useState([]);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [nextDirection, setNextDirection] = useState("forward");
  const [viewMode, setViewMode] = useState("thirdPerson"); // 'firstPerson' or 'thirdPerson'
  const [isLoading, setIsLoading] = useState(true);

  // 生成停车位
  const generateParkingSpots = () => {
    if (!parkingLotData || !parkingLotData.spots) return [];

    const spots = [];
    const spotData = parkingLotData.spots;

    // 将对象转换为数组
    Object.keys(spotData).forEach((spotId) => {
      const spot = spotData[spotId];

      // 计算位置 (根据行和列)
      const x = spot.col * 3 - 15; // 假设每个停车位宽3米，从X轴-15开始
      const z = spot.row * 6 - 5; // 假设每个停车位长6米，从Z轴-5开始

      spots.push({
        id: spotId,
        position: [x, z],
        size: spot.size || [2.5, 5], // 默认大小
        isOccupied: spot.is_occupied,
        isRecommended: parkingLotData.recommended_spot?.id === spotId,
      });
    });

    return spots;
  };

  // 计算行驶路径
  useEffect(() => {
    if (!parkingLotData || !parkingLotData.recommended_spot) {
      setIsLoading(false);
      return;
    }

    // 模拟加载时间
    setTimeout(() => {
      setIsLoading(false);

      const recommendedSpot = parkingLotData.recommended_spot;
      const spotData = parkingLotData.spots[recommendedSpot.id];

      if (spotData) {
        // 计算目标停车位的位置
        const targetX = spotData.col * 3 - 15;
        const targetZ = spotData.row * 6 - 5;

        // 生成行驶路径 (入口 -> 行驶通道 -> 目标车位)
        const generatedPath = [
          [0, 15], // 入口
          [0, 10], // 开始移动
          [-5, 5], // 转弯点1
          [targetX - 3, 5], // 行驶到目标车位所在列的通道
          [targetX - 3, targetZ], // 到达目标车位旁边的通道
          [targetX, targetZ], // 最终停车位置
        ];

        setPath(generatedPath);
      }
    }, 1500);
  }, [parkingLotData]);

  // 自动驾驶功能
  useEffect(() => {
    if (!path.length || !isNavigating) return;

    let animationId;
    let currentTime = 0;
    const animationDuration = 15000; // 15秒完成整个路径

    const animate = (timestamp) => {
      if (!currentTime) currentTime = timestamp;

      const elapsedTime = timestamp - currentTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);

      setNavigationProgress(progress * 100);

      if (progress < 1) {
        // 计算当前位置
        const currentIndex = Math.min(
          Math.floor(progress * (path.length - 1)),
          path.length - 2
        );

        const nextIndex = currentIndex + 1;
        const segmentProgress = (progress * (path.length - 1)) % 1;

        // 当前位置
        const currentPoint = path[currentIndex];
        const nextPoint = path[nextIndex];

        // 计算插值位置
        const x =
          currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress;
        const z =
          currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress;

        // 计算朝向 (面向下一个点)
        let angle = Math.atan2(
          nextPoint[1] - currentPoint[1],
          nextPoint[0] - currentPoint[0]
        );

        // 设置车辆位置和朝向
        setCarPosition([x, 0.1, z]);
        setCarRotation([0, angle - Math.PI / 2, 0]);

        // 确定下一个方向指令
        let direction;
        if (currentIndex < path.length - 2) {
          const current = new THREE.Vector2(currentPoint[0], currentPoint[1]);
          const next = new THREE.Vector2(nextPoint[0], nextPoint[1]);
          const afterNext = new THREE.Vector2(
            path[nextIndex + 1][0],
            path[nextIndex + 1][1]
          );

          const currentDirection = next.clone().sub(current).normalize();
          const nextDirection = afterNext.clone().sub(next).normalize();

          const angle = Math.atan2(
            currentDirection.x * nextDirection.y -
              currentDirection.y * nextDirection.x,
            currentDirection.dot(nextDirection)
          );

          if (Math.abs(angle) < 0.3) {
            direction = "forward";
          } else if (angle > 0) {
            direction = "left";
          } else {
            direction = "right";
          }
        } else {
          direction = "forward";
        }

        setNextDirection(direction);

        animationId = requestAnimationFrame(animate);
      } else {
        // 导航完成
        setNextDirection(null);
        onParkingComplete && onParkingComplete();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [path, isNavigating, onParkingComplete]);

  // 切换到手动驾驶模式
  const handleManualDriving = () => {
    // 实现手动驾驶的键盘控制
    const handleKeyDown = (e) => {
      const speed = 0.5;
      const rotationSpeed = 0.05;

      switch (e.key) {
        case "ArrowUp":
          setCarPosition((prev) => [
            prev[0] + Math.sin(carRotation[1]) * speed,
            prev[1],
            prev[2] + Math.cos(carRotation[1]) * speed,
          ]);
          break;
        case "ArrowDown":
          setCarPosition((prev) => [
            prev[0] - Math.sin(carRotation[1]) * speed,
            prev[1],
            prev[2] - Math.cos(carRotation[1]) * speed,
          ]);
          break;
        case "ArrowLeft":
          setCarRotation((prev) => [prev[0], prev[1] + rotationSpeed, prev[2]]);
          break;
        case "ArrowRight":
          setCarRotation((prev) => [prev[0], prev[1] - rotationSpeed, prev[2]]);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  };

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            flexDirection: "column",
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>加载停车场模型和路径规划...</Typography>
        </Box>
      ) : (
        <>
          {/* 3D场景 */}
          <Canvas shadows>
            <Suspense fallback={null}>
              <Sky
                turbidity={8}
                rayleigh={6}
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
                sunPosition={[100, 10, 100]}
              />
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={0.7}
                castShadow
              />

              <Physics>
                {/* 地面和停车场环境 */}
                <Ground />

                {/* 停车位 */}
                {generateParkingSpots().map((spot, index) => (
                  <ParkingSpot
                    key={index}
                    id={spot.id}
                    position={spot.position}
                    size={spot.size}
                    isOccupied={spot.isOccupied}
                    isRecommended={spot.isRecommended}
                  />
                ))}

                {/* 车辆 */}
                <Car
                  position={carPosition}
                  rotation={carRotation}
                  modelPath={selectedVehicle?.model_path || "/models/sedan.glb"}
                  isMoving={isNavigating}
                />

                {/* 行驶路径 */}
                {path.length > 0 && (
                  <DrivingPath path={path} progress={navigationProgress} />
                )}
              </Physics>

              {/* 相机控制 */}
              {viewMode === "thirdPerson" ? (
                <OrbitControls
                  target={[carPosition[0], carPosition[1], carPosition[2]]}
                />
              ) : (
                <FirstPersonCamera
                  carPosition={carPosition}
                  carRotation={carRotation}
                  isFirstPerson={true}
                />
              )}
            </Suspense>
          </Canvas>

          {/* 小地图导航 */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 200,
              height: 200,
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 3,
            }}
          >
            <NavigationMiniMap
              parkingLayout={generateParkingSpots()}
              carPosition={[carPosition[0], carPosition[2]]}
              carRotation={carRotation[1]}
              navigationPath={path}
              progress={navigationProgress}
            />
          </Box>

          {/* 控制按钮 */}
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              gap: 2,
            }}
          >
            <Fab
              color="primary"
              onClick={() =>
                setViewMode((prev) =>
                  prev === "thirdPerson" ? "firstPerson" : "thirdPerson"
                )
              }
            >
              <CameraAlt />
            </Fab>
            <Fab
              color="secondary"
              onClick={() => setIsNavigating((prev) => !prev)}
            >
              <DirectionsCar />
            </Fab>
          </Box>

          {/* 方向提示UI (仅在第一人称视图和导航模式下显示) */}
          {viewMode === "firstPerson" && isNavigating && nextDirection && (
            <DirectionUI nextDirection={nextDirection} />
          )}

          {/* AI语音提示区域 */}
          {isNavigating && nextDirection && (
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                bottom: 16,
                left: 16,
                p: 2,
                maxWidth: 300,
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                AI 语音提示
              </Typography>
              <Typography variant="body2">
                {nextDirection === "forward"
                  ? "请继续直行前进。"
                  : nextDirection === "left"
                  ? "前方请注意左转。"
                  : nextDirection === "right"
                  ? "前方请注意右转。"
                  : "即将到达目的地。"}
              </Typography>
              {parkingLotData.ai_reasoning && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {parkingLotData.ai_reasoning}
                </Typography>
              )}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default ParkingSimulator;

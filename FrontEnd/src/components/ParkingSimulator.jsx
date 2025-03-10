import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  Suspense,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Stats,
  Sky,
  Html,
  Text,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// 改进的停车场模型组件，添加了模型加载完成的回调
function ParkingLot({ position = [0, 0, 0], scale = 1, onLoad }) {
  const { scene } = useGLTF("/models/parking.glb");
  const parkingLotRef = useRef();
  const [modelBounds, setModelBounds] = useState(null);

  // 复制模型并设置材质
  useEffect(() => {
    if (scene) {
      // 克隆场景，避免修改原始模型
      const clonedScene = scene.clone();

      // 计算模型边界
      const boundingBox = new THREE.Box3().setFromObject(clonedScene);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);

      // 设置模型边界信息，用于后续碰撞检测和路径规划
      setModelBounds({
        min: boundingBox.min,
        max: boundingBox.max,
        size: size,
        center: new THREE.Vector3(
          (boundingBox.min.x + boundingBox.max.x) / 2,
          (boundingBox.min.y + boundingBox.max.y) / 2,
          (boundingBox.min.z + boundingBox.max.z) / 2
        ),
      });

      // 遍历所有网格，设置为可接收阴影
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // 设置碰撞检测标志
          child.userData.isObstacle = true;
        }
      });

      // 将克隆的场景添加到引用
      parkingLotRef.current.add(clonedScene);

      // 通知模型已加载完成
      if (onLoad) {
        onLoad(modelBounds);
      }
    }
  }, [scene, onLoad]);

  return (
    <group
      ref={parkingLotRef}
      position={position}
      scale={[scale, scale, scale]}
      rotation={[-Math.PI / 2, 0, 0]} // 修改旋转角度，使停车场水平放置
    />
  );
}

// 创建可点击的地板，但只在停车场道路上允许点击
function ClickableFloor({ onFloorClick, parkingBounds, navMesh }) {
  const planeRef = useRef();
  const { camera } = useThree();

  // 使用导航网格或边界信息
  const isValidPosition = useCallback(
    (position) => {
      if (!parkingBounds) return true;

      // 基本边界检查
      if (
        position.x < parkingBounds.min.x ||
        position.x > parkingBounds.max.x ||
        position.z < parkingBounds.min.z ||
        position.z > parkingBounds.max.z
      ) {
        return false;
      }

      // 如果有导航网格，检查点是否在允许的路径上
      if (navMesh && navMesh.length > 0) {
        // 这里应该实现一个算法来检查点是否在允许的路径上
        // 简化版：检查点是否靠近任何导航点
        return navMesh.some(
          (point) =>
            Math.sqrt(
              Math.pow(position.x - point.x, 2) +
                Math.pow(position.z - point.z, 2)
            ) < 2
        );
      }

      return true;
    },
    [parkingBounds, navMesh]
  );

  const handleClick = (event) => {
    // 获取点击位置
    if (planeRef.current && onFloorClick) {
      // 将屏幕坐标转换为3D坐标
      const intersects = event.intersections.filter(
        (intersect) => intersect.object === planeRef.current
      );

      if (intersects.length > 0) {
        const point = intersects[0].point;

        // 检查点击位置是否有效（在道路上）
        if (isValidPosition(point)) {
          onFloorClick(point);
        } else {
          // 位置无效，可以显示提示
          console.log("无法在此处行驶 - 不是道路");
        }
      }
    }
  };

  // 创建一个大平面作为点击区域，但使其透明
  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial
        transparent={true}
        opacity={0.0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// 目标指示器，显示点击位置
function TargetIndicator({ position, isTargetSpot }) {
  const ref = useRef();

  // 添加动画效果
  useFrame(({ clock }) => {
    if (ref.current) {
      // 上下浮动动画
      ref.current.position.y =
        position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.1 + 0.2;

      // 目标点旋转动画
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* 垂直光柱 */}
      <mesh position={[0, 2, 0]} ref={ref}>
        <cylinderGeometry args={[0.2, 0.2, 4, 16]} />
        <meshStandardMaterial
          color={isTargetSpot ? "#ff9800" : "#03a9f4"}
          transparent={true}
          opacity={0.6}
        />
      </mesh>

      {/* 地面标记 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial
          color={isTargetSpot ? "#ff9800" : "#03a9f4"}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

// 改进的车辆组件，使用React.forwardRef获取引用
const Car = React.forwardRef(({ position = [0, 0, 0], scale = 1 }, ref) => {
  const { scene } = useGLTF("/models/car.glb");
  const carModelRef = useRef();
  const targetPositionRef = useRef(new THREE.Vector3(...position));
  const targetRotationRef = useRef(new THREE.Euler(0, 0, 0));
  const isMovingRef = useRef(false);
  const pathRef = useRef([]);
  const currentPathIndexRef = useRef(0);
  const currentVelocityRef = useRef(0);
  const maxVelocityRef = useRef(0.15);
  const accelerationRef = useRef(0.01);
  const decelerationRef = useRef(0.02);
  const rotationSpeedRef = useRef(0.1);

  // 初始化场景
  useEffect(() => {
    if (scene && carModelRef.current) {
      const clonedScene = scene.clone();

      // 遍历所有网格，设置阴影
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // 添加到组引用
      carModelRef.current.add(clonedScene);
    }
  }, [scene]);

  // 处理车辆移动动画
  useFrame(() => {
    if (!carModelRef.current || !isMovingRef.current) return;

    const carPosition = new THREE.Vector3();
    carModelRef.current.getWorldPosition(carPosition);

    // 如果有路径，按照路径点移动
    if (
      pathRef.current.length > 0 &&
      currentPathIndexRef.current < pathRef.current.length
    ) {
      // 获取当前目标路径点
      const targetPoint = pathRef.current[currentPathIndexRef.current];
      const target = new THREE.Vector3(
        targetPoint.x,
        carPosition.y,
        targetPoint.z
      );

      // 计算到目标点的距离
      const distanceToTarget = carPosition.distanceTo(target);

      if (distanceToTarget < 0.5) {
        // 到达当前路径点，前进到下一个
        currentPathIndexRef.current++;

        // 如果还有下一个点，调整转向
        if (currentPathIndexRef.current < pathRef.current.length) {
          const nextPoint = pathRef.current[currentPathIndexRef.current];

          // 计算新的目标旋转角度（车头朝向）
          const direction = new THREE.Vector3(
            nextPoint.x - carPosition.x,
            0,
            nextPoint.z - carPosition.z
          ).normalize();

          targetRotationRef.current.y = Math.atan2(direction.x, direction.z);
        }
      } else {
        // 向目标点移动

        // 1. 首先调整车辆朝向
        const currentRotation = carModelRef.current.rotation.y;
        const targetRotation = targetRotationRef.current.y;

        // 计算最短旋转方向
        let rotationDiff = targetRotation - currentRotation;
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

        // 根据与目标点的角度差旋转车身
        if (Math.abs(rotationDiff) > 0.05) {
          // 如果角度差较大，先旋转
          carModelRef.current.rotation.y +=
            Math.sign(rotationDiff) * rotationSpeedRef.current;

          // 旋转时减速
          currentVelocityRef.current = Math.max(
            currentVelocityRef.current * 0.9,
            0.02
          );
        } else {
          // 角度已经接近，可以加速向前
          carModelRef.current.rotation.y = targetRotation;

          // 加速但不超过最大速度
          currentVelocityRef.current = Math.min(
            currentVelocityRef.current + accelerationRef.current,
            maxVelocityRef.current
          );
        }

        // 2. 根据当前朝向和速度移动
        const moveDirection = new THREE.Vector3(
          Math.sin(carModelRef.current.rotation.y),
          0,
          Math.cos(carModelRef.current.rotation.y)
        );

        // 应用速度和方向
        carModelRef.current.position.add(
          moveDirection.multiplyScalar(currentVelocityRef.current)
        );
      }
    } else if (isMovingRef.current) {
      // 到达最终目标，停止移动
      isMovingRef.current = false;
      currentVelocityRef.current = 0;
    }
  });

  // 向外暴露的方法
  React.useImperativeHandle(ref, () => ({
    // 移动到指定位置，具有路径规划
    moveTo: (targetPosition, navigationMesh) => {
      if (!carModelRef.current) return;

      // 获取当前位置
      const currentPosition = new THREE.Vector3();
      carModelRef.current.getWorldPosition(currentPosition);

      // 设置目标位置
      targetPositionRef.current.set(
        targetPosition.x,
        currentPosition.y,
        targetPosition.z
      );

      // 计算从当前位置到目标位置的路径
      // 这里可以实现A*寻路算法，但简化版本只考虑直线路径
      pathRef.current = [
        { x: currentPosition.x, z: currentPosition.z },
        { x: targetPosition.x, z: targetPosition.z },
      ];

      // 重置路径索引
      currentPathIndexRef.current = 0;

      // 计算目标方向
      const direction = new THREE.Vector3(
        targetPosition.x - currentPosition.x,
        0,
        targetPosition.z - currentPosition.z
      ).normalize();

      // 设置目标旋转（车头朝向）
      targetRotationRef.current.y = Math.atan2(direction.x, direction.z);

      // 启动移动
      isMovingRef.current = true;
    },

    // 获取当前位置
    getPosition: () => {
      const position = new THREE.Vector3();
      if (carModelRef.current) {
        carModelRef.current.getWorldPosition(position);
      }
      return position;
    },

    // 检查是否正在移动
    isMoving: () => isMovingRef.current,
  }));

  return (
    <group ref={carModelRef} position={position} scale={[scale, scale, scale]}>
      {/* 车辆模型由useGLTF加载 */}
    </group>
  );
});

// 高亮显示的停车位
function ParkingSpotHighlight({ spot, isTarget }) {
  const color = isTarget ? "#ff9800" : "#4caf50";

  return (
    <group position={[spot.x, 0.05, spot.z]}>
      {/* 停车位边界 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 5]} />
        <meshStandardMaterial color={color} transparent={true} opacity={0.4} />
      </mesh>

      {/* 停车位编号 */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 1, 0]}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontSize={0.5}
        >
          {spot.id}
        </Text>
      </Billboard>
    </group>
  );
}

// 加载界面
function Loader() {
  return (
    <Html center>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 3,
          borderRadius: 2,
          bgcolor: "rgba(0,0,0,0.7)",
          boxShadow: 3,
        }}
      >
        <CircularProgress size={60} sx={{ color: "white" }} />
        <Typography variant="body1" sx={{ color: "white", mt: 2 }}>
          Loading 3D Environment...
        </Typography>
      </Box>
    </Html>
  );
}

// 游戏完成消息
function GameCompleteMessage({ onRestart, onClose }) {
  return (
    <Html center>
      <Paper
        elevation={10}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: "rgba(0,0,0,0.85)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 350,
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "#4caf50" }}>
          Perfect Parking!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          You've successfully parked your car in the designated spot.
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RestartAltIcon />}
            onClick={onRestart}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            sx={{ color: "white", borderColor: "white" }}
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </Paper>
    </Html>
  );
}

// 游戏指导说明
function GameInstructions({ onClose }) {
  return (
    <Html center>
      <Paper
        elevation={10}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: "rgba(0,0,0,0.85)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 400,
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "#2196f3" }}>
          3D Parking Simulator
        </Typography>
        <Typography variant="body1" paragraph>
          Experience what it's like to navigate and park at this location.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1, alignSelf: "flex-start" }}>
          How to play:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 24 }}>
          <li>
            <Typography variant="body2">
              Click anywhere on the parking lot roads to drive
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Navigate to the highlighted parking spot
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Rotate the view using mouse drag or touch
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Zoom in/out with mouse wheel or pinch
            </Typography>
          </li>
        </ul>
        <Button variant="contained" sx={{ mt: 3 }} onClick={onClose}>
          Start Game
        </Button>
      </Paper>
    </Html>
  );
}

// 改进的3D场景组件
function Scene({ difficulty = "medium", onGameComplete, onRetry }) {
  const carRef = useRef(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const [carInitialized, setCarInitialized] = useState(false);
  const [parkingLotLoaded, setParkingLotLoaded] = useState(false);
  const [parkingBounds, setParkingBounds] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [targetSpot, setTargetSpot] = useState(null);
  const [targetSpotReached, setTargetSpotReached] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameEndTime, setGameEndTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const navigationMeshRef = useRef([]);
  const { camera } = useThree();

  // 初始化3D场景
  useEffect(() => {
    // 设置更好的相机位置，使视野更聚焦于停车场
    camera.position.set(5, 15, 20);
    camera.lookAt(0, 0, 0);

    // 生成导航网格 - 简化版本，实际应基于停车场模型生成
    const navMesh = [];
    navigationMeshRef.current = navMesh;

    // 生成目标停车位 - 根据难度级别选择不同位置
    // 调整坐标系，考虑模型旋转
    const spotPositions = {
      easy: { x: 5, z: 5, id: "A1" },
      medium: { x: -5, z: 5, id: "B3" },
      hard: { x: -5, z: -5, id: "C7" },
    };

    setTargetSpot(spotPositions[difficulty] || spotPositions.medium);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [camera, difficulty]);

  // 启动游戏计时器
  useEffect(() => {
    if (!showInstructions && !gameComplete && !timerRef.current) {
      setGameStartTime(Date.now());

      timerRef.current = setInterval(() => {
        if (gameStartTime) {
          setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showInstructions, gameComplete, gameStartTime]);

  // 处理停车场模型加载完成
  const handleParkingLotLoaded = (bounds) => {
    setParkingLotLoaded(true);
    setParkingBounds(bounds);

    // 基于停车场边界设置更好的初始相机位置
    if (bounds) {
      const center = bounds.center;
      const size = bounds.size;

      // 调整相机位置，考虑到模型旋转后的新坐标系
      camera.position.set(
        center.x,
        size.z * 1.5, // 使用z轴作为高度，因为模型被旋转了
        center.z + size.y * 1.5 // 调整z位置，使相机看向模型中心
      );
      camera.lookAt(center.x, 0, center.z);
    }
  };

  // 汽车点击地面移动处理
  const handleFloorClick = (position) => {
    if (carRef.current && !gameComplete) {
      // 设置目标位置
      setTargetPosition(position);

      // 调用车辆的moveTo方法
      carRef.current.moveTo(position, navigationMeshRef.current);

      // 检查是否点击了目标停车位附近
      if (targetSpot) {
        const distanceToTargetSpot = Math.sqrt(
          Math.pow(position.x - targetSpot.x, 2) +
            Math.pow(position.z - targetSpot.z, 2)
        );

        // 如果在目标停车位附近
        if (distanceToTargetSpot < 1.5) {
          handleTargetSpotReached();
        }
      }
    }
  };

  // 处理到达目标停车位
  const handleTargetSpotReached = () => {
    if (!targetSpotReached) {
      setTargetSpotReached(true);

      // 等待车辆停下来
      setTimeout(() => {
        // 完成游戏
        setGameComplete(true);
        setGameEndTime(Date.now());

        // 停止计时器
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // 如果有回调函数，则传递游戏结果
        if (onGameComplete) {
          const timeElapsed = gameStartTime
            ? Math.floor((Date.now() - gameStartTime) / 1000)
            : 0;

          onGameComplete({
            timeElapsed,
            spot: targetSpot,
            score: calculateScore(timeElapsed, difficulty),
            difficulty,
          });
        }
      }, 1500);
    }
  };

  // 计算游戏得分
  const calculateScore = (time, difficulty) => {
    // 基础分数
    let baseScore = 1000;

    // 难度系数
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
    };

    // 时间惩罚
    // 时间越长，得分越低，但设置最低分
    const timeDeduction = Math.min(time * 5, 800);

    // 最终分数
    const score = Math.max(
      100,
      Math.round(
        (baseScore - timeDeduction) * (difficultyMultiplier[difficulty] || 1)
      )
    );

    return score;
  };

  // 重新开始游戏
  const handleRetry = () => {
    // 重置所有状态
    setTargetPosition(null);
    setCarInitialized(false);
    setGameComplete(false);
    setTargetSpotReached(false);
    setGameStartTime(null);
    setGameEndTime(null);
    setElapsedTime(0);

    // 重置车辆位置
    if (carRef.current) {
      if (carRef.current.node) {
        carRef.current.node.position.set(0, 0, 10);
        carRef.current.node.rotation.set(0, 0, 0);
      }
    }

    // 显示指导说明
    setShowInstructions(true);

    // 如果有回调，则调用
    if (onRetry) onRetry();
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* 天空背景 - 调整时间和阴影 */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* 环境光和定向光 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* 停车场模型 - 居中显示，保持1.5倍缩放 */}
      <ParkingLot
        position={[0, 0, 0]}
        scale={1.5}
        onLoad={handleParkingLotLoaded}
      />

      {/* 可点击的地板 - 上移到与模型对齐 */}
      <ClickableFloor
        onFloorClick={handleFloorClick}
        parkingBounds={parkingBounds}
        navMesh={navigationMeshRef.current}
      />

      {/* 显示目标停车位 */}
      {targetSpot && <ParkingSpotHighlight spot={targetSpot} isTarget={true} />}

      {/* 目标位置指示器 */}
      {targetPosition && !gameComplete && (
        <TargetIndicator
          position={[targetPosition.x, 0, targetPosition.z]}
          isTargetSpot={
            targetSpot &&
            Math.sqrt(
              Math.pow(targetPosition.x - targetSpot.x, 2) +
                Math.pow(targetPosition.z - targetSpot.z, 2)
            ) < 1.5
          }
        />
      )}

      {/* 汽车 - 上移位置以适应旋转后的模型 */}
      <Car ref={carRef} position={[0, 0.5, 10]} scale={0.5} />

      {/* 游戏完成消息 */}
      {gameComplete && (
        <GameCompleteMessage
          onRestart={handleRetry}
          onClose={() => {
            if (onGameComplete) {
              onGameComplete({
                timeElapsed: elapsedTime,
                spot: targetSpot,
                score: calculateScore(elapsedTime, difficulty),
                difficulty,
                closed: true,
              });
            }
          }}
        />
      )}

      {/* 游戏说明 */}
      {showInstructions && (
        <GameInstructions onClose={() => setShowInstructions(false)} />
      )}

      {/* 游戏UI - 计时器和目标 */}
      {!showInstructions && !gameComplete && (
        <Html
          position={[0, 0, 0]}
          style={{
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "10px 15px",
              borderRadius: "8px",
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ marginBottom: "4px" }}>
                Time: {formatTime(elapsedTime)}
              </div>
              <div>Target: Spot {targetSpot?.id}</div>
            </div>
          </div>
        </Html>
      )}

      {/* 轨道控制器 - 限制角度和距离 */}
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={false}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export default function ParkingSimulator({
  open,
  onClose,
  parkingLotId = "default",
  difficulty = "medium", // easy, medium, hard
}) {
  const [gameResults, setGameResults] = useState(null);

  const handleGameComplete = (results) => {
    setGameResults(results);

    // 如果用户关闭模拟器，传递结果
    if (results && results.closed) {
      if (onClose) onClose(gameResults);
    }
  };

  const handleRetry = () => {
    setGameResults(null);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={() => onClose && onClose(gameResults)}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: 10,
          backgroundColor: "#1a1a1a",
          height: "80vh",
          margin: 0,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          backgroundColor: "#000",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="div">
          3D Parking Simulator
        </Typography>
        <IconButton
          aria-label="close"
          onClick={() => onClose && onClose(gameResults)}
          sx={{
            color: "white",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          backgroundColor: "#000",
          height: "100%",
        }}
      >
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <Canvas shadows camera={{ position: [5, 15, 20], fov: 50 }}>
            <Suspense fallback={<Loader />}>
              <Scene
                difficulty={difficulty}
                onGameComplete={handleGameComplete}
                onRetry={handleRetry}
              />
            </Suspense>
          </Canvas>
        </div>
      </DialogContent>
    </Dialog>
  );
}

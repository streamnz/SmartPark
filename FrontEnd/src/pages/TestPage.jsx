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
  PerspectiveCamera,
  Stats,
  Environment,
  Sky,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { Box, Typography, Button, CircularProgress } from "@mui/material";

// 键盘控制钩子
function useKeyControls() {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 根据按键更新状态
      switch (e.code) {
        case "KeyW":
          setMovement((prev) => ({ ...prev, forward: true }));
          break;
        case "KeyS":
          setMovement((prev) => ({ ...prev, backward: true }));
          break;
        case "KeyA":
          setMovement((prev) => ({ ...prev, left: true }));
          break;
        case "KeyD":
          setMovement((prev) => ({ ...prev, right: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      // 松开按键时重置状态
      switch (e.code) {
        case "KeyW":
          setMovement((prev) => ({ ...prev, forward: false }));
          break;
        case "KeyS":
          setMovement((prev) => ({ ...prev, backward: false }));
          break;
        case "KeyA":
          setMovement((prev) => ({ ...prev, left: false }));
          break;
        case "KeyD":
          setMovement((prev) => ({ ...prev, right: false }));
          break;
        default:
          break;
      }
    };

    // 添加事件监听器
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 清理函数
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movement;
}

// 停车场模型
function ParkingLot(props) {
  const { scene } = useGLTF("/models/parking.glb");

  // 克隆场景以避免引用问题
  const parkingLot = useMemo(() => {
    return scene.clone();
  }, [scene]);

  useEffect(() => {
    // 设置模型材质和阴影
    parkingLot.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // 修正模型旋转 - 将竖直模型旋转为水平
    // 根据模型具体情况调整这些值
    parkingLot.rotation.x = -Math.PI / 2; // 绕X轴旋转90度
    // 如果还需要其他旋转调整
    // parkingLot.rotation.z = Math.PI; // 可能需要调整

    // 可能还需要调整位置
    parkingLot.position.y = 0; // 确保模型在地面上
  }, [parkingLot]);

  return <primitive object={parkingLot} {...props} />;
}

// 创建一个地板组件，用于捕获鼠标点击
function ClickableFloor({ onFloorClick }) {
  const meshRef = useRef();

  // 设置点击事件
  const handleClick = (event) => {
    // 阻止事件冒泡
    event.stopPropagation();

    // 如果提供了点击回调函数，调用它并传递点击位置
    if (onFloorClick && event.point) {
      onFloorClick(event.point);
    }
  };

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      receiveShadow
      onClick={handleClick}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial
        color="#444"
        roughness={1}
        opacity={0.1}
        transparent
      />
    </mesh>
  );
}

// 导航目标点指示器
function TargetIndicator({ position }) {
  if (!position) return null;

  // 创建一个动画效果
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // 初始显示动画
    setScale(0.5);
    const timer = setTimeout(() => setScale(1), 50);
    return () => clearTimeout(timer);
  }, [position]);

  return (
    <group position={[position.x, 0.1, position.z]}>
      {/* 垂直光柱 */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#4fc3f7" opacity={0.6} transparent />
      </mesh>

      {/* 底部圆环 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4 * scale, 0.8 * scale, 16]} />
        <meshStandardMaterial color="#4fc3f7" opacity={0.8} transparent />
      </mesh>
    </group>
  );
}

// 汽车模型 - 修改为鼠标点击控制
const Car = React.forwardRef((props, ref) => {
  const { scene } = useGLTF("/models/car.glb");
  const carRef = useRef();
  const [targetPosition, setTargetPosition] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  // 停车场边界 - 根据实际模型调整这些值
  const parkingBounds = {
    minX: -18,
    maxX: 18,
    minZ: -15,
    maxZ: 15,
  };

  // 克隆场景以避免引用问题
  const car = useMemo(() => {
    return scene.clone();
  }, [scene]);

  useEffect(() => {
    // 设置模型材质和阴影
    car.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [car]);

  // 设置移动目标
  const moveTo = useCallback(
    (point) => {
      // 检查点击位置是否在边界内
      if (
        point.x >= parkingBounds.minX &&
        point.x <= parkingBounds.maxX &&
        point.z >= parkingBounds.minZ &&
        point.z <= parkingBounds.maxZ
      ) {
        setTargetPosition(point);
        setIsMoving(true);
      } else {
        console.log("Target position out of bounds");
      }
    },
    [parkingBounds]
  );

  // 向父组件暴露方法
  React.useImperativeHandle(ref, () => ({
    moveTo,
  }));

  // 处理汽车移动 - 替换原来的键盘控制
  useFrame((state, delta) => {
    if (!carRef.current || !targetPosition || !isMoving) return;

    // 当前位置
    const currentPosition = carRef.current.position;

    // 计算方向向量
    const directionX = targetPosition.x - currentPosition.x;
    const directionZ = targetPosition.z - currentPosition.z;

    // 距离
    const distance = Math.sqrt(
      directionX * directionX + directionZ * directionZ
    );

    // 如果足够接近目标，停止移动
    if (distance < 0.2) {
      setIsMoving(false);
      return;
    }

    // 计算单位方向向量
    const normalizedX = directionX / distance;
    const normalizedZ = directionZ / distance;

    // 移动速度
    const speed = 5 * delta;

    // 计算这一帧的移动距离
    const moveX = normalizedX * speed;
    const moveZ = normalizedZ * speed;

    // 更新位置
    currentPosition.x += moveX;
    currentPosition.z += moveZ;

    // 计算朝向角度（汽车头朝向移动方向）
    const targetAngle = Math.atan2(normalizedX, normalizedZ);

    // 平滑旋转（插值）
    const currentRotation = carRef.current.rotation.y;
    const rotationDiff = targetAngle - currentRotation;

    // 处理角度跨越±π的情况
    let shortestRotation = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;

    // 旋转速度
    const rotationSpeed = 5 * delta;

    // 应用旋转
    carRef.current.rotation.y +=
      Math.sign(shortestRotation) *
      Math.min(Math.abs(shortestRotation), rotationSpeed);
  });

  return (
    <>
      <primitive ref={carRef} object={car} {...props} />

      {/* 显示导航目标点 */}
      {targetPosition && isMoving && (
        <TargetIndicator position={targetPosition} />
      )}
    </>
  );
});

// 加载占位符
function Loader() {
  return (
    <Html center>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          background: "rgba(0,0,0,0.7)",
          padding: 3,
          borderRadius: 2,
        }}
      >
        <CircularProgress color="info" size={60} sx={{ mb: 2 }} />
        <Typography variant="body1">Loading 3D models...</Typography>
      </Box>
    </Html>
  );
}

// 场景控件
function Scene() {
  const { camera } = useThree();
  const [viewMode, setViewMode] = useState("orbit"); // 'orbit' | 'first-person'
  const controlsRef = useRef();
  const carRef = useRef();

  // 设置摄影机初始位置 - 调整为与图片一致的视角
  useEffect(() => {
    // 根据图片更精确地调整摄像机位置
    camera.position.set(0, 35, 50);
    // 确保摄像机看向停车场中央
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 处理地板点击
  const handleFloorClick = useCallback((point) => {
    if (carRef.current) {
      carRef.current.moveTo(point);
    }
  }, []);

  return (
    <>
      {/* 基础场景元素 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 30, 20]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* 可点击的地面 */}
      <ClickableFloor onFloorClick={handleFloorClick} />

      {/* 加载模型 */}
      <Suspense fallback={<Loader />}>
        <ParkingLot position={[0, 0, 0]} scale={1} />
        {/* 更精确地调整车辆位置，使其与图片中位置一致 */}
        <Car
          ref={carRef}
          position={[0, 0.7, 30]}
          rotation={[0, Math.PI, 0]}
          scale={1}
        />
      </Suspense>

      {/* 控制器 - 微调控制器目标点 */}
      {viewMode === "orbit" && (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          target={[0, 0, 0]}
          minDistance={5}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      )}

      {/* 天空 - 调整为浅蓝色以匹配图片 */}
      <Sky sunPosition={[60, 30, 50]} azimuth={0.5} rayleigh={0.3} />

      {/* 使用指南 - 放置在停车场中央，与图片一致 */}
      <Html position={[0, 5, 0]} center>
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "16px",
            borderRadius: "5px",
            fontSize: "16px",
            width: "240px",
            textAlign: "center",
          }}
        >
          <p>
            <b>Click</b> anywhere on the parking lot
          </p>
          <p>The car will navigate to that position</p>
        </div>
      </Html>

      {/* 调试和性能统计 */}
      <Stats />
    </>
  );
}

// 控制面板
function ControlPanel({ toggleCamera }) {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        padding: 2,
        borderRadius: 2,
        display: "flex",
        gap: 2,
        alignItems: "center",
      }}
    >
      <Typography variant="body2">
        使用 WASD 控制汽车移动 | 拖动鼠标旋转视角
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={toggleCamera}
        sx={{ ml: 2 }}
      >
        切换视角
      </Button>
    </Box>
  );
}

// 主测试页面组件
export default function TestPage() {
  const [cameraMode, setCameraMode] = useState("orbit");

  const toggleCamera = () => {
    setCameraMode((prev) => (prev === "orbit" ? "first-person" : "orbit"));
  };

  // 预加载模型
  useEffect(() => {
    useGLTF.preload("/models/parking.glb");
    useGLTF.preload("/models/car.glb");

    return () => {
      // 清理资源
      useGLTF.clear();
      THREE.Cache.clear();
    };
  }, []);

  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative" }}>
      <Canvas shadows gl={{ antialias: true }}>
        <Scene />
      </Canvas>

      <ControlPanel toggleCamera={toggleCamera} />

      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6">3D Model Test Page</Typography>
        <Typography variant="body2">
          Testing models: parking.glb & car.glb
        </Typography>
      </Box>
    </Box>
  );
}

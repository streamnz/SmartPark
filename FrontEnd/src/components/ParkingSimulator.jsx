import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Sky, Html } from "@react-three/drei";
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
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ViewInArIcon from "@mui/icons-material/ViewInAr";

// Parking lot model component with load callback
function ParkingLot({ position = [0, 0, 0], scale = 1, onLoad }) {
  const { scene } = useGLTF("/models/parking.glb");
  const parkingLotRef = useRef();
  const [modelBounds, setModelBounds] = useState(null);

  // Copy model and set materials
  useEffect(() => {
    if (scene) {
      // Clone scene to avoid modifying original model
      const clonedScene = scene.clone();

      // Calculate model boundaries
      const boundingBox = new THREE.Box3().setFromObject(clonedScene);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);

      // Set model boundary information
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

      // Process all meshes, set shadows
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Enhance material quality
          if (child.material) {
            child.material.roughness = 0.7;
            child.material.metalness = 0.2;
          }
        }
      });

      // Add cloned scene to reference
      parkingLotRef.current.add(clonedScene);

      // Notify model loaded
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
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to place horizontally
    />
  );
}

// Loading screen
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
          bgcolor: "rgba(0,0,0,0.85)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "white" }} />
        <Typography
          variant="body1"
          sx={{
            color: "white",
            mt: 2,
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          Loading 3D Environment...
        </Typography>
      </Box>
    </Html>
  );
}

// 3D scene component
function Scene() {
  const { camera } = useThree();
  const [parkingLotLoaded, setParkingLotLoaded] = useState(false);

  // Handle model load
  const handleParkingLotLoaded = (bounds) => {
    setParkingLotLoaded(true);

    // Set better camera position
    if (bounds) {
      camera.position.set(0, 20, 25);
      camera.lookAt(0, 0, 0);
    }
  };

  return (
    <>
      {/* Sky background */}
      <Sky sunPosition={[100, 50, 100]} />

      {/* Ambient and directional light */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Add some accent lights to highlight the model */}
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#64B5F6" />
      <pointLight position={[10, 8, 10]} intensity={0.4} color="#BBDEFB" />

      {/* Parking lot model */}
      <ParkingLot
        position={[0, 0, 0]}
        scale={1.5}
        onLoad={handleParkingLotLoaded}
      />

      {/* Camera controls */}
      <OrbitControls
        target={[0, 0, 0]}
        enablePan={true}
        minDistance={10}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Main 3D Simulator Dialog Component
export default function ParkingSimulator({
  open,
  onClose,
  parkingLotId = "default",
}) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: 12,
          backgroundColor: "#121212",
          height: "80vh",
          margin: 0,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          backgroundColor: "rgba(0,0,0,0.85)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <DirectionsCarIcon
            sx={{
              color: "#64B5F6",
              fontSize: 28,
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            3D Parking Lot Preview
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          backgroundColor: "#121212",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <Canvas shadows camera={{ position: [0, 20, 25], fov: 50 }}>
            <Suspense fallback={<Loader />}>
              <Scene />
            </Suspense>
          </Canvas>
        </div>
      </DialogContent>
      <DialogActions
        sx={{
          backgroundColor: "rgba(0,0,0,0.85)",
          p: 2,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontStyle: "italic",
            }}
          >
            Use mouse to rotate and zoom the model
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              bgcolor: "#2196f3",
              "&:hover": {
                bgcolor: "#1976d2",
              },
            }}
          >
            Close
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

// 3D模拟器按钮 - 风格与SELECT按钮统一，但保持粉色调，尺寸更小
export function Simulator3DButton({ onClick }) {
  return (
    <Button
      variant="contained"
      size="small"
      onClick={onClick}
      sx={{
        backgroundColor: "#e91e63", // 粉色调
        color: "white",
        fontSize: "10px",
        padding: "1px 8px",
        height: "22px",
        borderRadius: "2px",
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        fontWeight: 500,
        boxShadow: "none",
        marginRight: "8px", // 增加右侧边距
        minWidth: "85px", // 减小最小宽度
        "&:hover": {
          backgroundColor: "#c2185b", // 悬停时深粉色
          boxShadow: "none",
        },
      }}
    >
      3D Simulator
    </Button>
  );
}

// SELECT按钮 - 保持一致的风格
export function SelectButton({ onClick }) {
  return (
    <Button
      variant="contained"
      size="small"
      onClick={onClick}
      sx={{
        backgroundColor: "#323232",
        color: "white",
        fontSize: "11px",
        padding: "2px 12px",
        height: "24px",
        borderRadius: "2px",
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        fontWeight: 500,
        boxShadow: "none",
        minWidth: "46px",
        "&:hover": {
          backgroundColor: "#1a1a1a",
          boxShadow: "none",
        },
      }}
    >
      SELECT
    </Button>
  );
}

// 组合按钮组件 - 用于在停车场列表项中显示两个按钮
export function ParkingLotActions({ onOpenSimulator, onSelect }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        width: "100%",
      }}
    >
      <Simulator3DButton onClick={onOpenSimulator} />
      <SelectButton onClick={onSelect} />
    </Box>
  );
}

// 停车模拟结果组件 - 被设置为不显示任何内容
export function ParkingSimulationResults({
  open,
  onClose,
  onNavigate,
  parkingSpot,
  time,
  score,
}) {
  // 不渲染任何内容，相当于移除了红框中的弹窗
  return null;
}

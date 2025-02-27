import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 默认车辆配置
const defaultVehicle = {
  id: "sedan",
  model_path: "/models/sedan.glb",
  scale: 1.0,
  rotation: [0, Math.PI, 0], // 默认方向
  offset: [0, 0, 0], // 模型中心点偏移
};

// 不同车辆类型的具体配置
const vehicleConfigs = {
  sedan: {
    scale: 0.8,
    rotation: [0, Math.PI, 0],
    offset: [0, -0.1, 0],
  },
  suv: {
    scale: 0.9,
    rotation: [0, Math.PI, 0],
    offset: [0, -0.1, 0],
  },
  pickup: {
    scale: 1.0,
    rotation: [0, Math.PI, 0],
    offset: [0, -0.1, 0],
  },
  van: {
    scale: 1.1,
    rotation: [0, Math.PI, 0],
    offset: [0, -0.1, 0],
  },
};

const Vehicle3D = ({ vehicleType, position }) => {
  const vehicleRef = useRef();
  const [lastPosition, setLastPosition] = useState(position);
  const [facingDirection, setFacingDirection] = useState(0);

  // 获取车辆配置
  const config = vehicleConfigs[vehicleType] || defaultVehicle;

  // 使用简化的盒子模型替代glTF模型(用于开发)
  // 实际应用需要使用真实的3D模型
  const { scene } = useGLTF(config.model_path || "/models/fallback_car.glb");

  // 移动和旋转逻辑
  useFrame(() => {
    // 如果位置没有变化，不处理旋转
    if (position[0] === lastPosition[0] && position[2] === lastPosition[2]) {
      return;
    }

    // 计算移动方向
    const dx = position[0] - lastPosition[0];
    const dz = position[2] - lastPosition[2];
    const movementMagnitude = Math.sqrt(dx * dx + dz * dz);

    // 如果移动量太小，不处理旋转
    if (movementMagnitude < 0.01) {
      return;
    }

    // 计算目标角度
    const targetAngle = Math.atan2(dx, dz);

    // 平滑旋转(插值)
    let newAngle = facingDirection;
    const smoothing = 0.1; // 旋转平滑系数

    // 处理角度差异大于PI的情况(角度包装)
    const angleDiff = targetAngle - facingDirection;
    if (angleDiff > Math.PI) {
      newAngle += (targetAngle - 2 * Math.PI - facingDirection) * smoothing;
    } else if (angleDiff < -Math.PI) {
      newAngle += (targetAngle + 2 * Math.PI - facingDirection) * smoothing;
    } else {
      newAngle += angleDiff * smoothing;
    }

    setFacingDirection(newAngle);

    // 应用旋转
    vehicleRef.current.rotation.y = newAngle + config.rotation[1];

    setLastPosition(position);
  });

  // 克隆车辆模型
  const clonedScene = scene.clone();

  return (
    <group
      ref={vehicleRef}
      position={[position[0], position[1] + config.offset[1], position[2]]}
      rotation={[
        config.rotation[0],
        facingDirection + config.rotation[1],
        config.rotation[2],
      ]}
      scale={[config.scale, config.scale, config.scale]}
    >
      <primitive object={clonedScene} />
    </group>
  );
};

export default Vehicle3D;

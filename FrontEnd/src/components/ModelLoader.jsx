import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 通用GLB模型加载器组件
 *
 * @param {Object} props 组件属性
 * @param {string} props.url 模型URL路径
 * @param {Array} props.position 模型位置 [x, y, z]
 * @param {Array} props.rotation 模型旋转 [x, y, z]
 * @param {number} props.scale 模型缩放比例
 * @param {boolean} props.animate 是否启用自动旋转动画
 * @param {boolean} props.correctVertical 是否自动修正竖直模型
 * @param {Function} props.onLoad 模型加载完成后的回调函数
 * @param {Function} props.onError 模型加载失败时的回调函数
 */
const ModelLoader = ({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  animate = false,
  correctVertical = false,
  onLoad,
  onError,
  ...props
}) => {
  const groupRef = useRef();

  // 加载模型
  const { scene, animations } = useGLTF(url, true);

  // 克隆场景以避免引用问题
  const model = scene.clone();

  // 初始化模型
  useEffect(() => {
    if (model) {
      console.log(`模型${url}加载成功`);

      // 自动修正竖直模型
      if (correctVertical) {
        // 将竖直模型旋转为水平
        model.rotation.x = -Math.PI / 2; // 绕X轴旋转90度

        // 重置位置以确保模型贴合地面
        // 这里可能需要根据具体模型调整
        if (url.includes("parking.glb")) {
          // 针对停车场模型的特殊调整
          model.position.y = 0;
        }
      }

      // 遍历模型中的所有对象
      model.traverse((object) => {
        if (object.isMesh) {
          // 启用阴影
          object.castShadow = true;
          object.receiveShadow = true;

          // 确保材质正确
          if (object.material) {
            // 防止材质出现黑色
            object.material.side = THREE.DoubleSide;

            // 如果模型显示异常，可以尝试调整材质
            // object.material.roughness = 0.5;
            // object.material.metalness = 0.5;
          }
        }
      });

      // 触发加载完成回调
      if (onLoad) onLoad(model);
    }

    return () => {
      // 清理资源
      model.traverse((object) => {
        if (object.isMesh) {
          if (object.geometry) object.geometry.dispose();

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    };
  }, [model, url, onLoad, correctVertical]);

  // 模型动画 (自动旋转)
  useFrame((state, delta) => {
    if (animate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
    >
      <primitive object={model} />
    </group>
  );
};

export default ModelLoader;

import React from "react";

// 简易汽车模型
export const SimpleCar = ({
  position = [0, 0, 0],
  scale = 1,
  color = "#3f51b5",
}) => {
  return (
    <group position={position} scale={scale}>
      {/* 车身 */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[2, 0.8, 4.5]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 车顶 */}
      <mesh castShadow position={[0, 1, -0.2]}>
        <boxGeometry args={[1.8, 0.7, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 挡风玻璃 */}
      <mesh castShadow position={[0, 0.9, 1.1]}>
        <boxGeometry args={[1.7, 0.5, 0.1]} />
        <meshStandardMaterial color="#a0d6ff" opacity={0.7} transparent />
      </mesh>

      {/* 车轮 */}
      <mesh castShadow position={[1, 0, 1.5]}>
        <cylinderGeometry
          args={[0.4, 0.4, 0.3, 16]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh castShadow position={[1, 0, -1.5]}>
        <cylinderGeometry
          args={[0.4, 0.4, 0.3, 16]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh castShadow position={[-1, 0, 1.5]}>
        <cylinderGeometry
          args={[0.4, 0.4, 0.3, 16]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh castShadow position={[-1, 0, -1.5]}>
        <cylinderGeometry
          args={[0.4, 0.4, 0.3, 16]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* 车灯 */}
      <mesh castShadow position={[0.7, 0.4, 2.26]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh castShadow position={[-0.7, 0.4, 2.26]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

// 简易停车场模型
export const SimpleParkingLot = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* 地面 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#555" roughness={1} />
      </mesh>

      {/* 停车位线 */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <group
            key={`spot-${row}-${col}`}
            position={[(col - 3.5) * 5, 0.01, (row - 2) * 6]}
          >
            {/* 停车位框线 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[4, 5]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[3.8, 4.8]} />
              <meshStandardMaterial color="#444" />
            </mesh>

            {/* 停车位编号 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.5]}>
              <planeGeometry args={[2, 1]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          </group>
        ))
      )}

      {/* 柱子 */}
      {[-15, 0, 15].map((x) =>
        [-20, 0, 20].map((z, i) => (
          <mesh key={`pillar-${x}-${z}`} position={[x, 2, z]} castShadow>
            <boxGeometry args={[1, 4, 1]} />
            <meshStandardMaterial color="#777" />
          </mesh>
        ))
      )}
    </group>
  );
};

// 简易摄像机
export const SimpleCamera = () => {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.4, 0.8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh castShadow position={[0, 0, 0.5]}>
        <cylinderGeometry
          args={[0.15, 0.2, 0.4, 16]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

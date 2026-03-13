import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { useBIMStore } from '../../store/bimStore';

import * as THREE from 'three';

const Beam = ({ position, rotation, length, color }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={[0.05, 0.05, length, 8]} />
    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
  </mesh>
);

const Connection = ({ position }) => (
  <mesh position={position} castShadow receiveShadow>
    <sphereGeometry args={[0.08, 16, 16]} />
    <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
  </mesh>
);

const Staircase = ({ position }) => (
  <group position={position}>
    {[...Array(8)].map((_, i) => (
      <mesh key={i} position={[0, i * 0.15, i * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.05, 0.3]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

const StructuralTower = () => {
  const groupRef = useRef();
  const { beamColor, autoRotate, towerHeight } = useBIMStore();

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Vertical Beams (adjusted by towerHeight) */}
      <Beam position={[-1, towerHeight, -1]} length={towerHeight * 2} color={beamColor} />
      <Beam position={[1, towerHeight, -1]} length={towerHeight * 2} color={beamColor} />
      <Beam position={[-1, towerHeight, 1]} length={towerHeight * 2} color={beamColor} />
      <Beam position={[1, towerHeight, 1]} length={towerHeight * 2} color={beamColor} />

      {/* Cross connections */}
      <Beam position={[0, towerHeight + 0.5, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]} length={2.8} color="#10b981" />
      <Beam position={[0, towerHeight + 0.5, 0]} rotation={[-Math.PI / 4, 0, Math.PI / 4]} length={2.8} color="#10b981" />

      {/* Connections */}
      {[[-1, towerHeight, -1], [1, towerHeight, -1], [-1, towerHeight, 1], [1, towerHeight, 1]].map((pos, i) => (
        <Connection key={i} position={pos} />
      ))}

      {/* Floating platform */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, towerHeight + 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} transparent opacity={0.9} />
        </mesh>
      </Float>

      <Staircase position={[1.5, 0.5, 0]} />
    </group>
  );
};

export const StructuralModel = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <StructuralTower />
      <Environment preset="city" />
    </>
  );
};

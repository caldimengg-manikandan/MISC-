// client/src/components/3d/Scene.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, SoftShadows } from '@react-three/drei';
import { StairModel } from './StairModel';

export const Scene3D = () => {
  return (
    <Canvas shadows camera={{ position: [8, 4, 8], fov: 25 }}>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.2} />
      
      <StairModel />
      
      <SoftShadows size={25} samples={25} />
      <Environment preset="city" />
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={5}
        maxDistance={20}
      />
    </Canvas>
  );
};
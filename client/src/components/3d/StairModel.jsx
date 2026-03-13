// client/src/components/3d/StairModel.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Float } from '@react-three/drei';

export const StairModel = () => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stair Structure */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 8]} />
        <meshStandardMaterial 
          color="#4b5563" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Stair Steps */}
      {[...Array(8)].map((_, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[-1.5, i * 0.2 + 0.15, i * 0.8 - 2.8]}>
            <boxGeometry args={[1, 0.2, 0.8]} />
            <meshStandardMaterial 
              color="#1e40af" 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Railings */}
      <mesh position={[2, 1.5, 0]}>
        <boxGeometry args={[0.05, 2.5, 8]} />
        <meshStandardMaterial 
          color="#dc2626" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <mesh position={[-2, 1.5, 0]}>
        <boxGeometry args={[0.05, 2.5, 8]} />
        <meshStandardMaterial 
          color="#dc2626" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Landing Platform */}
      <mesh position={[0, 1.6, 3.5]}>
        <boxGeometry args={[5, 0.1, 3]} />
        <meshStandardMaterial 
          color="#374151" 
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Reflective Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={50}
          depthScale={1}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
          color="#1f2937"
          metalness={0.8}
          roughness={1}
        />
      </mesh>
    </group>
  );
};
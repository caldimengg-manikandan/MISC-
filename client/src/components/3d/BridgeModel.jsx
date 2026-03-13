import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

const Cable = ({ start, end, color = "#f59e0b" }) => {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) +
    Math.pow(end[1] - start[1], 2) +
    Math.pow(end[2] - start[2], 2)
  );

  const midPoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 - 0.5,
    (start[2] + end[2]) / 2
  ];

  return (
    <mesh>
      <tubeGeometry args={[
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(...start),
          new THREE.Vector3(...midPoint),
          new THREE.Vector3(...end)
        ]),
        64,
        0.02,
        8,
        false
      ]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
    </mesh>
  );
};

export const BridgeModel = () => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const bridgeSpans = 5;
  const bridgeWidth = 1.5;

  return (
    <group ref={groupRef}>
      {/* Bridge Deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} castShadow receiveShadow>
        <planeGeometry args={[bridgeWidth, bridgeSpans * 2]} />
        <meshStandardMaterial 
          color="#374151" 
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Bridge Towers */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.6, 0, -bridgeSpans + 1]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 2, 0.1]} />
            <meshStandardMaterial color="#4f46e5" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[side * 0.6, 0, bridgeSpans - 1]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 2, 0.1]} />
            <meshStandardMaterial color="#4f46e5" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Suspension Cables */}
      {Array.from({ length: 8 }).map((_, i) => {
        const zPos = -bridgeSpans + (i * (bridgeSpans * 2 / 7));
        return (
          <React.Fragment key={i}>
            <Cable 
              start={[-0.6, 1.5, zPos]}
              end={[0, -0.4, zPos]}
            />
            <Cable 
              start={[0.6, 1.5, zPos]}
              end={[0, -0.4, zPos]}
            />
          </React.Fragment>
        );
      })}

      {/* Floating Construction Elements */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 1, -1]} castShadow receiveShadow>
          <torusGeometry args={[0.3, 0.05, 16, 32]} />
          <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={1} floatIntensity={0.8}>
        <mesh position={[0.5, 0.8, 1]} castShadow receiveShadow>
          <icosahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#10b981" metalness={0.9} roughness={0.1} />
        </mesh>
      </Float>
    </group>
  );
};
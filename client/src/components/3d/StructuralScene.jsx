import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, GridHelper, AxesHelper } from '@react-three/drei';
import { StructuralModel } from './StructuralModel';
import ControlPanel from '../ControlPanel';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <div className="text-sm">Loading {progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

export const StructuralScene = () => {
  return (
    <div className="relative w-screen h-screen bg-gray-900 overflow-hidden">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-50">
        <ControlPanel />
      </div>

      {/* Diagnostic Canvas */}
      <Canvas
        shadows
        camera={{ position: [3, 3, 6], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #312e81)' }}
      >
        <Suspense fallback={<Loader />}>
          {/* Debug lights */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <pointLight position={[0, 5, 0]} intensity={0.8} color="white" />

          {/* ✅ Diagnostic cube (should appear immediately) */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>

          {/* ✅ Grid + Axes */}
          <gridHelper args={[20, 20]} />
          <axesHelper args={[3]} />

          {/* Your Structural Model */}
          <StructuralModel />

          <OrbitControls enableZoom enablePan />
        </Suspense>
      </Canvas>
    </div>
  );
};

// client/src/components/auth/Login3D.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  LogIn, UserPlus, Clock, Shield, TrendingUp as Stairs, Ruler,
  Calculator, Factory, HardHat, Zap, FileCode, Layers,
  Target, Award, Building2, Users, DollarSign, ArrowRight,
  ChevronRight, CheckCircle, AlertCircle, BarChart3,
  Briefcase, Crown, Lock, Unlock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// 3D Stair Component
const Stair3DModel = ({ assemblyProgress }) => {
  const [assemblyPhase, setAssemblyPhase] = useState(0);
  const groupRef = useRef();

  // Stair parts with dimensions in 3D
  const stairParts = [
    // Stringers
    {
      id: 1,
      type: 'stringer',
      name: 'Left Stringer',
      position: [-0.4, 0, 0],
      rotation: [0, 0, -Math.PI / 6],
      color: '#92400e',
      size: [0.02, 0.12, 1.2],
      visibleAt: 10,
      finalPos: [-0.4, 0, 0],
      finalRot: [0, 0, 0]
    },
    {
      id: 2,
      type: 'stringer',
      name: 'Right Stringer',
      position: [0.4, 0, 0],
      rotation: [0, 0, Math.PI / 6],
      color: '#92400e',
      size: [0.02, 0.12, 1.2],
      visibleAt: 20,
      finalPos: [0.4, 0, 0],
      finalRot: [0, 0, 0]
    },
    // Treads
    {
      id: 3,
      type: 'tread',
      name: 'Tread 1',
      position: [0, 0.2, -0.5],
      rotation: [Math.PI / 9, 0, 0],
      color: '#374151',
      size: [0.8, 0.02, 0.28],
      visibleAt: 30,
      finalPos: [0, 0.4, -0.4],
      finalRot: [0, 0, 0]
    },
    {
      id: 4,
      type: 'tread',
      name: 'Tread 2',
      position: [0.3, 0.1, -0.2],
      rotation: [-Math.PI / 9, 0, 0],
      color: '#374151',
      size: [0.8, 0.02, 0.28],
      visibleAt: 40,
      finalPos: [0, 0.2, -0.2],
      finalRot: [0, 0, 0]
    },
    {
      id: 5,
      type: 'tread',
      name: 'Tread 3',
      position: [-0.3, 0.3, 0.1],
      rotation: [Math.PI / 6, 0, 0],
      color: '#374151',
      size: [0.8, 0.02, 0.28],
      visibleAt: 50,
      finalPos: [0, 0, 0],
      finalRot: [0, 0, 0]
    },
    // Riser
    {
      id: 6,
      type: 'riser',
      name: 'Riser',
      position: [0.2, 0.15, 0.3],
      rotation: [-Math.PI / 6, 0, 0],
      color: '#4b5563',
      size: [0.8, 0.015, 0.15],
      visibleAt: 60,
      finalPos: [0, 0.34, -0.3],
      finalRot: [0, 0, 0]
    },
    // Handrail
    {
      id: 7,
      type: 'handrail',
      name: 'Handrail',
      position: [-0.2, 0.6, -0.1],
      rotation: [0, -Math.PI / 12, 0],
      color: '#1d4ed8',
      size: [1.0, 0.01, 0.01],
      visibleAt: 70,
      finalPos: [0, 0.6, -0.2],
      finalRot: [Math.PI / 6, 0, 0]
    },
    // Guardrail
    {
      id: 8,
      type: 'guardrail',
      name: 'Guardrail',
      position: [0.2, 0.5, 0.2],
      rotation: [0, Math.PI / 12, 0],
      color: '#047857',
      size: [1.2, 0.015, 0.015],
      visibleAt: 80,
      finalPos: [0, 0.5, -0.1],
      finalRot: [Math.PI / 6, 0, 0]
    },
    // Posts
    {
      id: 9,
      type: 'post',
      name: 'Left Post',
      position: [-0.3, 0.8, 0.4],
      rotation: [Math.PI / 3, 0, 0],
      color: '#78350f',
      size: [0.02, 0.02, 0.4],
      visibleAt: 90,
      finalPos: [-0.38, 0.2, -0.38],
      finalRot: [0, 0, 0]
    },
    {
      id: 10,
      type: 'post',
      name: 'Right Post',
      position: [0.3, 0.7, 0.3],
      rotation: [-Math.PI / 3, 0, 0],
      color: '#78350f',
      size: [0.02, 0.02, 0.4],
      visibleAt: 95,
      finalPos: [0.38, 0.2, -0.38],
      finalRot: [0, 0, 0]
    }
  ];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Grid Floor */}
      <gridHelper args={[2, 20, '#6b7280', '#6b7280']} position={[0, -0.2, 0]} />

      {/* Coordinate axes */}
      <axesHelper args={[0.5]} />

      {/* Stair Parts */}
      {stairParts.map((part) => {
        const progress = assemblyProgress;
        const isVisible = progress >= part.visibleAt;
        const animationProgress = Math.max(0, Math.min(1, (progress - part.visibleAt) / 10));

        const currentPos = [
          part.position[0] + (part.finalPos[0] - part.position[0]) * animationProgress,
          part.position[1] + (part.finalPos[1] - part.position[1]) * animationProgress,
          part.position[2] + (part.finalPos[2] - part.position[2]) * animationProgress
        ];

        const currentRot = [
          part.rotation[0] + (part.finalRot[0] - part.rotation[0]) * animationProgress,
          part.rotation[1] + (part.finalRot[1] - part.rotation[1]) * animationProgress,
          part.rotation[2] + (part.finalRot[2] - part.rotation[2]) * animationProgress
        ];

        return (
          <mesh
            key={part.id}
            position={currentPos}
            rotation={currentRot}
            visible={isVisible}
            castShadow
            receiveShadow
          >
            <boxGeometry args={part.size} />
            <meshStandardMaterial
              color={part.color}
              metalness={0.8}
              roughness={0.2}
              emissive={isVisible ? `${part.color}33` : '#000000'}
            />

            {/* Connection welds */}
            {isVisible && animationProgress > 0.5 && part.type !== 'handrail' && part.type !== 'guardrail' && (
              <>
                {[...Array(2)].map((_, i) => (
                  <mesh key={`weld-${i}`} position={[0, 0, 0]}>
                    <sphereGeometry args={[0.008, 8, 8]} />
                    <meshBasicMaterial color="#fbbf24" />
                  </mesh>
                ))}
              </>
            )}
          </mesh>
        );
      })}

      {/* Assembly progress indicator */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Labels */}
      <Html position={[0, 0.8, 0]} center>
        <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-mono">
          {assemblyProgress.toFixed(0)}% Assembled
        </div>
      </Html>

      {/* Measurements */}
      <group>
        {/* Riser height line */}
        <mesh position={[0.5, 0.2, -0.3]}>
          <boxGeometry args={[0.002, 0.18, 0.002]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <Text
          position={[0.55, 0.3, -0.3]}
          fontSize={0.05}
          color="#10b981"
          anchorX="left"
        >
          7"
        </Text>

        {/* Tread depth line */}
        <mesh position={[0, 0.21, -0.1]}>
          <boxGeometry args={[0.28, 0.002, 0.002]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
        <Text
          position={[0.15, 0.25, -0.1]}
          fontSize={0.05}
          color="#3b82f6"
          anchorX="center"
        >
          11"
        </Text>
      </group>
    </group>
  );
};

// Camera controller
const CameraController = () => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(1.5, 0.8, 1.5);
    camera.lookAt(0, 0.2, 0);
  }, [camera]);

  return null;
};

const Login3D = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOwnerLogin, setIsOwnerLogin] = useState(false);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [isAssembling, setIsAssembling] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company: '',
    phone: '',
    specialty: ''
  });
  const [daysRemaining, setDaysRemaining] = useState(30);
  const { login, register, loading } = useAuth();

  // Stair specifications
  const stairSpecs = [
    { label: 'Riser Height', value: '7"', standard: 'IBC 1011.5', status: 'compliant' },
    { label: 'Tread Depth', value: '11"', standard: 'IBC 1011.5.2', status: 'compliant' },
    { label: 'Handrail Height', value: '38"', standard: 'IBC 1014', status: 'compliant' },
    { label: 'Guardrail Height', value: '42"', standard: 'OSHA 1910.29', status: 'compliant' },
    { label: 'Width', value: '44"', standard: 'IBC 1011.2', status: 'compliant' },
    { label: 'Slope', value: '32°', standard: 'IBC 1011.5', status: 'compliant' }
  ];

  // Assembly phases
  const assemblyPhases = [
    { step: 1, name: 'Stringers', status: 'complete' },
    { step: 2, name: 'Treads', status: 'complete' },
    { step: 3, name: 'Risers', status: 'complete' },
    { step: 4, name: 'Posts', status: 'in-progress' },
    { step: 5, name: 'Handrails', status: 'pending' },
    { step: 6, name: 'Guardrails', status: 'pending' }
  ];

  useEffect(() => {
    // Calculate days remaining for trial
    const today = new Date();
    const trialEnd = new Date(today.setDate(today.getDate() + 30));
    const diffTime = trialEnd - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays);

    // Start 3D assembly animation
    const animateAssembly = () => {
      setIsAssembling(true);
      let progress = 0;

      const interval = setInterval(() => {
        progress += 0.5;
        setAssemblyProgress(progress);

        // Update phases
        if (progress >= 90) {
          assemblyPhases[5].status = 'complete';
        } else if (progress >= 80) {
          assemblyPhases[5].status = 'in-progress';
          assemblyPhases[4].status = 'complete';
        } else if (progress >= 70) {
          assemblyPhases[4].status = 'in-progress';
          assemblyPhases[3].status = 'complete';
        } else if (progress >= 60) {
          assemblyPhases[3].status = 'in-progress';
          assemblyPhases[2].status = 'complete';
        } else if (progress >= 50) {
          assemblyPhases[2].status = 'in-progress';
          assemblyPhases[1].status = 'complete';
        } else if (progress >= 30) {
          assemblyPhases[1].status = 'in-progress';
          assemblyPhases[0].status = 'complete';
        } else if (progress >= 10) {
          assemblyPhases[0].status = 'in-progress';
        }

        if (progress >= 100) {
          clearInterval(interval);
          setIsAssembling(false);
          setTimeout(() => {
            setAssemblyProgress(0);
            setTimeout(animateAssembly, 1000);
          }, 3000);
        }
      }, 50);

      return () => clearInterval(interval);
    };

    animateAssembly();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login(formData.email, formData.password, isOwnerLogin);
      } else {
        await register(formData, isOwnerLogin);
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    }
  };

  useEffect(() => {
    if (isOwnerLogin) {
      setDaysRemaining(0);
    } else if (!isLogin) {
      setDaysRemaining(30);
    }
  }, [isOwnerLogin, isLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                          linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="MISCStairPro Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden p-2 bg-blue-600 rounded-lg">
                <Stairs className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                MISC<span className="text-blue-400">Stair</span>Pro
              </h1>
              <p className="text-sm text-gray-300">Professional 3D Stair Design Suite</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">IBC Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">3D Estimation</span>
              </div>
            </div>

            {isOwnerLogin ? (
              <motion.div
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-full px-4 py-2 border border-purple-700/30"
                whileHover={{ scale: 1.05 }}
              >
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">
                  Owner Account
                </span>
              </motion.div>
            ) : !isLogin ? (
              <motion.div
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-900/30 to-blue-800/20 rounded-full px-4 py-2 border border-blue-700/30"
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">
                  {daysRemaining} Days Free Trial
                </span>
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center space-x-2 bg-gradient-to-r from-green-900/30 to-green-800/20 rounded-full px-4 py-2 border border-green-700/30"
                whileHover={{ scale: 1.05 }}
              >
                <LogIn className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">
                  Sign In to Continue
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - 3D Stair Visualization */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">3D Stair Assembly</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-gray-300">Live Assembly</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 ${isOwnerLogin
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                  : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                  }`}>
                  {isOwnerLogin ? (
                    <>
                      <Crown className="w-3 h-3" />
                      <span>Owner Mode</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      <span>User Mode</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="relative h-[500px] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-700/50">
              <Canvas shadows camera={{ position: [2, 1, 2], fov: 50 }}>
                <color attach="background" args={['#0f172a']} />

                {/* Lighting */}
                <ambientLight intensity={0.3} />
                <pointLight position={[5, 5, 5]} intensity={0.8} color="#3b82f6" />
                <pointLight position={[-5, 3, -5]} intensity={0.5} color="#8b5cf6" />
                <spotLight
                  position={[3, 5, 1]}
                  angle={0.3}
                  penumbra={1}
                  intensity={1}
                  castShadow
                  shadow-mapSize={[2048, 2048]}
                />

                {/* 3D Model */}
                <Stair3DModel assemblyProgress={assemblyProgress} />

                {/* Controls */}
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  minDistance={0.5}
                  maxDistance={5}
                  autoRotate={!isAssembling}
                  autoRotateSpeed={0.5}
                />
                <CameraController />
              </Canvas>

              {/* Assembly progress bar */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Assembly Progress</span>
                  <span className="text-sm font-bold text-blue-400">{Math.round(assemblyProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 via-blue-500 to-green-600 h-2 rounded-full"
                    style={{ width: `${assemblyProgress}%` }}
                    transition={{ type: "spring" }}
                  />
                </div>
              </div>

              {/* Controls hint */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                <div className="text-xs text-gray-400">Drag to rotate • Scroll to zoom</div>
              </div>
            </div>

            {/* Assembly phases */}
            <div className="mt-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {assemblyPhases.map((phase) => (
                  <div
                    key={phase.step}
                    className={`p-3 rounded-lg text-center ${phase.status === 'complete'
                      ? 'bg-green-900/30 border border-green-700/50'
                      : phase.status === 'in-progress'
                        ? 'bg-blue-900/30 border border-blue-700/50'
                        : 'bg-gray-800/30 border border-gray-700/50'
                      }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {phase.status === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : phase.status === 'in-progress' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-300">{phase.name}</div>
                    <div className="text-xs text-gray-500">Step {phase.step}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stair specifications */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {stairSpecs.map((spec, index) => (
                <motion.div
                  key={spec.label}
                  className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-gray-400">{spec.label}</div>
                      <div className="text-lg font-bold text-white">{spec.value}</div>
                    </div>
                    <div className={`p-1 rounded ${spec.status === 'compliant' ? 'bg-green-900/50' : 'bg-red-900/50'
                      }`}>
                      {spec.status === 'compliant' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{spec.standard}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700/50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
                {isOwnerLogin && ' (Owner)'}
              </h2>
              <p className="text-gray-300">
                {isLogin
                  ? (isOwnerLogin
                    ? 'Sign in to access owner analytics dashboard'
                    : 'Sign in to access your 3D stair design projects')
                  : (isOwnerLogin
                    ? 'Create owner account for analytics and user management'
                    : 'Start your 30-day free trial with full 3D access')
                }
              </p>
            </div>

            {/* Owner/User Toggle */}
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg bg-gray-800 p-1">
                  <button
                    onClick={() => setIsOwnerLogin(false)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center ${!isOwnerLogin
                      ? 'bg-gray-700 text-blue-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-300'
                      }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    User Account
                  </button>
                  <button
                    onClick={() => setIsOwnerLogin(true)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center ${isOwnerLogin
                      ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/30 text-purple-300 shadow-sm border border-purple-700/50'
                      : 'text-gray-400 hover:text-gray-300'
                      }`}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Owner Account
                  </button>
                </div>
              </div>

              {isOwnerLogin && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    {isLogin
                      ? 'Owner accounts access analytics dashboard and user management'
                      : 'Owner registration requires special authorization'}
                  </p>
                </div>
              )}
            </div>

            {/* Sign In/Sign Up Toggle Buttons */}
            <div className="flex mb-6 overflow-hidden rounded-lg bg-gray-800 p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-center font-semibold rounded-lg transition-all ${isLogin
                  ? 'bg-gray-700 text-blue-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
                  }`}
              >
                <span className="flex items-center justify-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </span>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-center font-semibold rounded-lg transition-all ${!isLogin
                  ? 'bg-gray-700 text-blue-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
                  }`}
              >
                <span className="flex items-center justify-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 text-sm bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white"
                  placeholder={isOwnerLogin ? "owner@company.com" : "engineer@company.com"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required={!isLogin}
                      className="w-full px-4 py-3 text-sm bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white"
                      placeholder={isOwnerLogin ? "Company LLC" : "Precision Stairs Inc."}
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  {!isOwnerLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Professional Specialty
                      </label>
                      <select
                        className="w-full px-4 py-3 text-sm bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white"
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      >
                        <option value="">Select your specialty</option>
                        <option value="commercial">Commercial Stairs</option>
                        <option value="industrial">Industrial Stairs</option>
                        <option value="architectural">Architectural Stairs</option>
                        <option value="residential">Residential Stairs</option>
                        <option value="structural">Structural Engineer</option>
                      </select>
                    </div>
                  )}

                  {!isOwnerLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 text-sm bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 text-sm bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-white"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-800"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                    Forgot password?
                  </a>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${isOwnerLogin
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500'
                  : 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500'
                  } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isLogin
                        ? (isOwnerLogin ? 'Sign In as Owner' : 'Sign In')
                        : (isOwnerLogin ? 'Create Owner Account' : 'Start Free Trial')
                      }
                    </span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Need help? <a href="#" className="text-blue-400 hover:text-blue-300">Contact support</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <Calculator className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white">2D Takeoff</div>
                <div className="text-sm text-gray-400">99% accurate</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-900/50 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Standards</div>
                <div className="text-sm text-gray-400">IBC • OSHA • AISC</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-900/50 rounded-lg">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Components</div>
                <div className="text-sm text-gray-400">200+ 3D models</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-900/50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Reports</div>
                <div className="text-sm text-gray-400">Auto-generated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login3D;
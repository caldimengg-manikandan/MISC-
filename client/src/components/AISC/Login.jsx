import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Building2, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';
import { authService } from '../services/authService';
import { StructuralScene } from './3d/StructuralScene';

const Login = ({ onToggleMode, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberDevice: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sceneRotation, setSceneRotation] = useState(true);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.login(formData.email, formData.password, formData.rememberDevice);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Interactive 3D Structural Model */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* 3D Scene */}
        <div className="absolute inset-0">
          <StructuralScene />
        </div>
        
        {/* Interactive Controls Overlay */}
        <div className="absolute bottom-6 left-6 z-10 flex space-x-3">
          <button
            onClick={() => setSceneRotation(!sceneRotation)}
            className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-xl hover:bg-black/70 transition-all duration-200 border border-white/20"
            title={sceneRotation ? "Pause Rotation" : "Play Rotation"}
          >
            {sceneRotation ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-xl hover:bg-black/70 transition-all duration-200 border border-white/20"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
        
        {/* Text Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white w-full">
          <div className="max-w-md">
            <Building2 className="w-16 h-16 mb-6 text-white/90" />
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              StructuralPro
            </h1>
            <p className="text-xl mb-6 text-white/80 font-light">
              Engineering the Future in 3D
            </p>
            <div className="space-y-3 text-white/70">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Real-time 3D Structural Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Advanced Beam & Connection Design</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span>Interactive Model Visualization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Info Cards */}
        <div className="absolute top-6 right-6 z-10 space-y-3">
          <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/20 max-w-xs">
            <div className="text-cyan-400 text-sm font-semibold">Live 3D Render</div>
            <div className="text-white/70 text-xs">Interactive structural model</div>
          </div>
          <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/20 max-w-xs">
            <div className="text-purple-400 text-sm font-semibold">Drag to Rotate</div>
            <div className="text-white/70 text-xs">Scroll to zoom • Right-click to pan</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-gray-50/50">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">StructuralPro</h1>
            <p className="text-gray-600 mt-2">3D Engineering Desktop Suite</p>
          </div>

          {/* Glassmorphism Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 mt-2">Sign in to your 3D engineering dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="engineer@company.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Device & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberDevice"
                    checked={formData.rememberDevice}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember this device</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => onToggleMode('forgot')}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Your Account'
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => onToggleMode('signup')}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Request access
                </button>
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>3D Secure • JWT Encrypted • Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
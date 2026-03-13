import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import Signup from './Signup';

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const renderComponent = () => {
    switch (mode) {
      case 'login':
        return (
          <Login
            onToggleMode={setMode}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      case 'forgot':
        return (
          <ForgotPassword
            onToggleMode={setMode}
            onBackToLogin={() => setMode('login')}
          />
        );
      case 'signup':
        return (
          <Signup
            onToggleMode={setMode}
            onBackToLogin={() => setMode('login')}
          />
        );
      default:
        return null;
    }
  };

  return renderComponent();
};

export default Auth;
// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { EstimationProvider } from './contexts/EstimationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <EstimationProvider>
          <App />
        </EstimationProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
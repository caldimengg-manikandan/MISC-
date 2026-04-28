// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { EstimationProvider } from './contexts/EstimationContext';

import configManager from './services/configManager';

const root = ReactDOM.createRoot(document.getElementById('root'));

async function init() {
  await configManager.load();
  
  root.render(
    <React.StrictMode>
      <Router basename={process.env.PUBLIC_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <EstimationProvider>
            <App />
          </EstimationProvider>
        </AuthProvider>
      </Router>
    </React.StrictMode>
  );
}

init();


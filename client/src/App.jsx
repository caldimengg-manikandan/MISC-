// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import LoginPage from './components/ui/animated-sign-in';
import LandingPage from './pages/Landing/LandingPage';
import ProductsPage from './pages/Landing/ProductsPage';

import './styles/globals.css';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />

      <Routes>
        {/* PUBLIC ROUTES — no auth required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* PROTECTED ROUTES / APP FLOW */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </>
  );
}

export default App;


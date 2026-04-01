// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import Login3D from './components/auth/Login';

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
        {/* PUBLIC ROUTE (Handles its own layout if needed) */}
        <Route path="/login" element={<Login3D />} />

        {/* PROTECTED ROUTES / APP FLOW */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </>
  );
}

export default App;

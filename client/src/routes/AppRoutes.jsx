// client/src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../components/common/PrivateRoute';
import MainLayout from '../layouts/MainLayout';

// Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import EstimationList from '../pages/Estimations/EstimationList';
import EstimationDetail from '../pages/Estimations/EstimationDetail';
import Calendar from '../pages/Calendar/Calendar';
import Reports from '../pages/Reports/Reports';

// Modules
import StairConfig from '../modules/Stair/StairConfig';

// Common
import Placeholder from '../components/common/PlaceholderModule';

const EngRoute = ({ element }) => (
  <PrivateRoute>
    <MainLayout>
      {element}
    </MainLayout>
  </PrivateRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<EngRoute element={<Dashboard />} />} />
      <Route path="/estimations" element={<EngRoute element={<EstimationList />} />} />
      <Route path="/project-info" element={<EngRoute element={<EstimationDetail />} />} />
      <Route path="/reports" element={<EngRoute element={<Reports />} />} />
      
      {/* Estimation Modules */}
      <Route path="/estimate/stair-railings" element={<EngRoute element={<StairConfig />} />} />
      <Route path="/estimate/railings" element={<EngRoute element={<Placeholder type="Railings" />} />} />
      <Route path="/estimate/ladders" element={<EngRoute element={<Placeholder type="Ladders" />} />} />
      <Route path="/estimate/bollards" element={<EngRoute element={<Placeholder type="Bollards" />} />} />
      <Route path="/estimate/gates" element={<EngRoute element={<Placeholder type="Gates" />} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;

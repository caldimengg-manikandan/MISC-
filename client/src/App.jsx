import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import MainLayout   from './components/layout/MainLayout';

// Auth & Public
import Login3D from './components/auth/Login';

// Existing Dashboards
import Home               from './components/dashboard/Home';
import Dashboard          from './components/dashboard/Dashboard';
import OwnerDashboard     from './components/dashboard/OwnerDashboard';
import RestrictedDashboard from './components/dashboard/RestrictedDashboard';

// Existing Estimation
import EstimationForm  from './components/estimation/EstimationForm';
import EstimationPage  from './components/estimation/EstimationPage';
import ShapeDatabase   from './components/estimation/ShapeDatabase';
import FinalEstimate   from './components/estimation/FinalEstimate';

// New Engineering Platform Pages
import ProjectInfo       from './components/project/ProjectInfo';
import ProjectHistory    from './components/project/ProjectHistory';
import StairEstimation   from './components/estimation/StairEstimation';
import PlaceholderModule from './components/estimation/PlaceholderModule';
import Reports           from './components/reports/Reports';

// Debug
import DebugHandrail from './components/debug/DebugHandrail';

import './styles/globals.css';

// Helper: wraps a page in PrivateRoute + MainLayout
const EngRoute = ({ element }) => (
  <PrivateRoute>
    <MainLayout>
      {element}
    </MainLayout>
  </PrivateRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
          }}
        />

        <Routes>
          {/* PUBLIC */}
          <Route path="/login" element={<Login3D />} />
          <Route path="/"      element={<Navigate to="/home" replace />} />

          {/* OWNER / ADMIN */}
          <Route
            path="/owner/dashboard"
            element={
              <PrivateRoute requireOwner={true}>
                <OwnerDashboard />
              </PrivateRoute>
            }
          />

          {/* EXISTING DASHBOARDS */}
          <Route path="/home"       element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/restricted" element={<PrivateRoute><RestrictedDashboard /></PrivateRoute>} />

          {/* EXISTING ESTIMATION */}
          <Route path="/costing"        element={<PrivateRoute><EstimationForm /></PrivateRoute>} />
          <Route path="/estimation"     element={<PrivateRoute><EstimationPage /></PrivateRoute>} />
          <Route path="/shape-database" element={<PrivateRoute><ShapeDatabase /></PrivateRoute>} />
          <Route path="/final-estimate" element={<PrivateRoute><FinalEstimate /></PrivateRoute>} />

          {/* NEW ENGINEERING PLATFORM */}
          <Route path="/project-history"         element={<EngRoute element={<ProjectHistory />} />} />
          <Route path="/project-info"            element={<EngRoute element={<ProjectInfo />} />} />
          <Route path="/estimate/stair-railings" element={<EngRoute element={<StairEstimation />} />} />
          <Route path="/estimate/railings"       element={<EngRoute element={<PlaceholderModule type="railings" />} />} />
          <Route path="/estimate/ladders"        element={<EngRoute element={<PlaceholderModule type="ladders" />} />} />
          <Route path="/estimate/bollards"       element={<EngRoute element={<PlaceholderModule type="bollards" />} />} />
          <Route path="/estimate/gates"          element={<EngRoute element={<PlaceholderModule type="gates" />} />} />
          <Route path="/reports"                 element={<EngRoute element={<Reports />} />} />

          {/* DEBUG */}
          <Route path="/debug/handrail" element={<PrivateRoute><DebugHandrail /></PrivateRoute>} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

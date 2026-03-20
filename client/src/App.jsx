import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import PrivateRoute from './components/common/PrivateRoute';
import MainLayout   from './components/layout/MainLayout';

// Auth & Public
import Login from './components/auth/Login';

// Existing Dashboards
import OwnerDashboard     from './components/dashboard/OwnerDashboard';

// Existing Estimation
// (Removing old estimation imports as they are replaced by the new platform)

// New Engineering Platform Pages
import ProjectInfo       from './components/project/ProjectInfo';
import ProjectHistory    from './components/project/ProjectHistory';
import StairEstimation   from './components/estimation/StairEstimation';
import PlaceholderModule from './components/estimation/PlaceholderModule';
import Reports           from './components/reports/Reports';

// Admin
import DictionaryManager from './components/admin/DictionaryManager';

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

const AdminRoute = ({ element }) => (
  <PrivateRoute requireAdmin={true}>
    <MainLayout>
      {element}
    </MainLayout>
  </PrivateRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
            }}
          />

          <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<Login />} />
            <Route path="/"      element={<Navigate to="/estimate/stair-railings" replace />} />

            {/* OWNER / ADMIN */}
            <Route
              path="/owner/dashboard"
              element={
                <PrivateRoute requireOwner={true}>
                  <OwnerDashboard />
                </PrivateRoute>
              }
            />

            {/* REDIRECTS TO NEW PLATFORM */}
            <Route path="/home"       element={<Navigate to="/estimate/stair-railings" replace />} />
            <Route path="/dashboard"  element={<Navigate to="/estimate/stair-railings" replace />} />

            {/* NEW ENGINEERING PLATFORM */}
            <Route path="/project-history"         element={<EngRoute element={<ProjectHistory />} />} />
            <Route path="/project-info"            element={<EngRoute element={<ProjectInfo />} />} />
            <Route path="/estimate/stair-railings" element={<EngRoute element={<StairEstimation />} />} />
            <Route path="/estimate/railings"       element={<EngRoute element={<PlaceholderModule type="railings" />} />} />
            <Route path="/estimate/ladders"        element={<EngRoute element={<PlaceholderModule type="ladders" />} />} />
            <Route path="/estimate/bollards"       element={<EngRoute element={<PlaceholderModule type="bollards" />} />} />
            <Route path="/estimate/gates"          element={<EngRoute element={<PlaceholderModule type="gates" />} />} />
            <Route path="/reports"                 element={<EngRoute element={<Reports />} />} />

            {/* ADMIN */}
            <Route path="/admin/dictionary"        element={<AdminRoute element={<DictionaryManager />} />} />

            {/* DEBUG */}
            <Route path="/debug/handrail" element={<PrivateRoute><DebugHandrail /></PrivateRoute>} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/estimate/stair-railings" replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

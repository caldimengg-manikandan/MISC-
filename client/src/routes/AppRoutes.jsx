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
import PricingSettings from '../pages/Settings/PricingSettings';
import SystemSettings from '../pages/Settings/SystemSettings';
import PersonalizationSettings from '../pages/Settings/PersonalizationSettings';
import ProfileSettings from '../pages/Settings/ProfileSettings';
import CustomerMaster from '../pages/Settings/CustomerMaster';
import LicenseSettings from '../pages/Settings/LicenseSettings';
import TeamManagement from '../pages/Settings/TeamManagement';
import SupportCenter from '../pages/Support/SupportCenter';



// Modules
import StairConfig from '../modules/Stair/StairConfig';
import RailingsConfig from '../modules/Rail/RailingsConfig';

// Common
import Placeholder from '../components/common/PlaceholderModule';
import SuperAdminRoute from '../components/common/SuperAdminRoute';

// SuperAdmin
import SuperAdminLayout from '../pages/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from '../pages/SuperAdmin/SuperAdminDashboard';
import LicenseManagement from '../pages/SuperAdmin/LicenseManagement';
import UserManagement from '../pages/SuperAdmin/UserManagement';
import ActivityLogs from '../pages/SuperAdmin/ActivityLogs';

// Library Hub
import LibraryHub from '../pages/Library/LibraryHub';

const EngRoute = ({ element }) => (
  <PrivateRoute>
    <MainLayout>
      {element}
    </MainLayout>
  </PrivateRoute>
);

const SaEngRoute = ({ element }) => (
  <SuperAdminRoute>
    <MainLayout>
      {element}
    </MainLayout>
  </SuperAdminRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<EngRoute element={<Dashboard />} />} />
      <Route path="/estimations" element={<EngRoute element={<EstimationList />} />} />
      <Route path="/project-info" element={<EngRoute element={<EstimationDetail />} />} />
      <Route path="/reports" element={<EngRoute element={<Reports />} />} />
      <Route path="/settings/pricing" element={<EngRoute element={<PricingSettings />} />} />
      <Route path="/settings/system" element={<EngRoute element={<SystemSettings />} />} />
      <Route path="/settings/personalization" element={<EngRoute element={<PersonalizationSettings />} />} />
      <Route path="/settings/customers" element={<EngRoute element={<CustomerMaster />} />} />
      <Route path="/settings/license" element={<EngRoute element={<LicenseSettings />} />} />
      <Route path="/settings/team" element={<EngRoute element={<TeamManagement />} />} />
      <Route path="/profile" element={<EngRoute element={<ProfileSettings />} />} />


      <Route path="/support" element={<EngRoute element={<SupportCenter />} />} />
      
      {/* Estimation Modules */}
      <Route path="/project/:projectId/estimate/stair-railings" element={<EngRoute element={<StairConfig />} />} />
      <Route path="/estimate/stair-railings" element={<EngRoute element={<StairConfig />} />} />
      <Route path="/estimate/railings" element={<EngRoute element={<RailingsConfig />} />} />
      <Route path="/estimate/ladders" element={<EngRoute element={<Placeholder type="Ladders" />} />} />
      <Route path="/estimate/bollards" element={<EngRoute element={<Placeholder type="Bollards" />} />} />
      <Route path="/estimate/gates" element={<EngRoute element={<Placeholder type="Gates" />} />} />

      <Route path="/superadmin/dashboard" element={<SaEngRoute element={<SuperAdminDashboard />} />} />
      <Route path="/superadmin/licenses" element={<SaEngRoute element={<LicenseManagement />} />} />
      <Route path="/superadmin/users" element={<SaEngRoute element={<UserManagement />} />} />
      <Route path="/superadmin/logs" element={<SaEngRoute element={<ActivityLogs />} />} />
      <Route path="/superadmin/config" element={<SaEngRoute element={<Placeholder type="SuperAdmin System Config" />} />} />
      <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />


      {/* Library Hub — admin/owner/superadmin only (enforced at API level) */}
      <Route path="/library" element={<EngRoute element={<LibraryHub />} />} />
      <Route path="/library/:category" element={<EngRoute element={<LibraryHub />} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
};

export default AppRoutes;


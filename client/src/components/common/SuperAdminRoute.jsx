// client/src/components/common/SuperAdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SuperAdminRoute;

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, guestOnly = false }) => {
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  if (guestOnly) {
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

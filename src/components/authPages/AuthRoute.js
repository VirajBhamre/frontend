import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { isAuthenticatedByCookie } from '../../utils/cookieUtils';

const AuthRoute = ({ children }) => {
  // Use cookie-based authentication check instead of localStorage
  const isAuthenticated = isAuthenticatedByCookie();

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

AuthRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthRoute;
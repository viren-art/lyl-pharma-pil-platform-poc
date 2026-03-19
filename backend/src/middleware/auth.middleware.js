/**
 * Authentication Middleware
 * Mock implementation for authentication
 * In production, this would validate JWT tokens
 */

export const requireAuth = (req, res, next) => {
  // Mock user for development
  req.user = {
    id: 1,
    email: 'ra.specialist@lotus.com',
    role: 'RASpecialist',
  };
  next();
};

export const extractIpAddress = (req, res, next) => {
  req.ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
  next();
};
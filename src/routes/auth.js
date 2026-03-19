import { Router } from 'express';
import { authenticateUser, blacklistToken, getUserById } from '../services/auth.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';

const router = Router();

// Apply IP extraction to all routes
router.use(extractIpAddress);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { token, jti, user } = await authenticateUser(email, password);

    // Log successful login
    await createAuditLog({
      userId: user.id,
      action: 'UserLogin',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        success: true
      },
      ipAddress: req.ipAddress
    });

    res.json({
      token,
      user
    });
  } catch (error) {
    // Log failed login attempt
    await createAuditLog({
      userId: null,
      action: 'UserLogin',
      entityType: 'User',
      entityId: null,
      details: {
        email: req.body.email,
        success: false,
        error: error.message
      },
      ipAddress: req.ipAddress
    });

    res.status(401).json({
      error: error.message || 'Authentication failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Blacklist JWT token
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { jti, userId } = req.user;

    blacklistToken(jti);

    // Log logout
    await createAuditLog({
      userId,
      action: 'UserLogout',
      entityType: 'User',
      entityId: userId,
      details: {
        jti
      },
      ipAddress: req.ipAddress
    });

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({
      error: error.message || 'User not found'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify token validity
 */
router.post('/verify', requireAuth, async (req, res) => {
  res.json({
    valid: true,
    user: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
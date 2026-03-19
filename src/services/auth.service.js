import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// LYL_DEP: bcrypt@5.1.1
// LYL_DEP: jsonwebtoken@9.0.2

const SALT_ROUNDS = 12;
const JWT_EXPIRATION = '8h';

// Mock user database (in production, this would be Prisma/PostgreSQL)
const users = [
  {
    id: 1,
    email: 'admin@lotus.com',
    hashedPassword: '', // Will be set on first use
    role: 'Admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 2,
    email: 'ra.manager@lotus.com',
    hashedPassword: '',
    role: 'RAManager',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 3,
    email: 'ra.specialist@lotus.com',
    hashedPassword: '',
    role: 'RASpecialist',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 4,
    email: 'aw.tech@lotus.com',
    hashedPassword: '',
    role: 'AWTechnician',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Initialize default passwords (for demo purposes)
const initializePasswords = async () => {
  for (const user of users) {
    if (!user.hashedPassword) {
      // Default password: "password123"
      user.hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
    }
  }
};

initializePasswords();

// Token blacklist for logout (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hashed password
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
export const generateToken = (user) => {
  const jti = randomUUID();
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    jti
  };

  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  const token = jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRATION,
    algorithm: 'HS256'
  });

  return { token, jti };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret);

    // Check if token is blacklisted
    if (tokenBlacklist.has(decoded.jti)) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Authenticate user with email and password
 */
export const authenticateUser = async (email, password) => {
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await comparePassword(password, user.hashedPassword);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const { token, jti } = generateToken(user);

  return {
    token,
    jti,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * Blacklist a token (for logout)
 */
export const blacklistToken = (jti) => {
  tokenBlacklist.add(jti);
};

/**
 * Get user by ID
 */
export const getUserById = (userId) => {
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }
  return requiredRoles.includes(userRole);
};
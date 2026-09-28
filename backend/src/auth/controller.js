import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import env from '../config/env.js';
import logger from '../shared/logger.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name, valid email, and password are required.'
        }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.'
        }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters long.'
        }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    }).catch((err) => {
      logger.warn('Auth', 'Database check existing user warning:', { error: err.message });
      return null;
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists. Please log in.'
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name.trim(),
          passwordHash: hashedPassword,
          avatar
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true
        }
      });
    } catch (createErr) {
      logger.error('Auth', 'User creation failed in DB:', { error: createErr.message });
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is currently unavailable. Please verify connection and try again.'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info('Auth', `New user registered: ${user.email}`, { userId: user.id, requestId: req.id });

    return res.status(201).json({
      success: true,
      token,
      user,
      message: 'Account created successfully'
    });
  } catch (error) {
    next(error);
  }
};



export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.'
        }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    }).catch((err) => {
      logger.warn('Auth', 'Database find user error during login:', { error: err.message });
      return null;
    });

    // Development demo account auto-provisioning
    if (!user && cleanEmail === 'demo@minigpt.dev' && password === 'password123') {
      try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        user = await prisma.user.upsert({
          where: { email: 'demo@minigpt.dev' },
          update: {},
          create: {
            email: 'demo@minigpt.dev',
            name: 'Demo Recruiter',
            passwordHash: hashedPassword,
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Demo'
          }
        });
      } catch (upsertErr) {
        // In-memory demo fallback only if DB is completely offline
        user = {
          id: 'demo-user-123',
          email: 'demo@minigpt.dev',
          name: 'Demo User',
          passwordHash: await bcrypt.hash('password123', 10),
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Demo'
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        }
      });
    }

    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email address or password.'
          }
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '7d' }
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
    };

    logger.info('Auth', `User logged in: ${safeUser.email}`, { userId: safeUser.id, requestId: req.id });

    return res.json({
      success: true,
      token,
      user: safeUser,
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, settings: true, createdAt: true }
    }).catch(() => null);

    if (!user) {
      user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.user.name || 'User')}`
      };
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe };

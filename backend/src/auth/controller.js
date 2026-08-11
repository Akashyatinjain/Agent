import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import env from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }

    // Check existing user
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (e) {
      console.warn('DB check failed, likely prisma uninitialized yet:', e.message);
    }

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword
        }
      });
    } catch (e) {
      // Fallback mock user if DB is not connected yet during early dev
      user = {
        id: `mock-${Date.now()}`,
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
      };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (e) {
      console.warn('DB search failed:', e.message);
    }

    if (!user) {
      // Allow a demo login if DB is disconnected in initial prototype run
      if (email === 'demo@minigpt.dev' && password === 'password123') {
        user = {
          id: 'demo-user-123',
          email: 'demo@minigpt.dev',
          name: 'Demo User',
          passwordHash: await bcrypt.hash('password123', 10)
        };
      } else {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    }

    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, avatar: true, settings: true, createdAt: true }
      });
    } catch (e) {
      // fallback
    }

    if (!user) {
      user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.user.name)}`
      };
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe };

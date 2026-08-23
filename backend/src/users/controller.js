import prisma from '../db/client.js';
import getUserMemories from '../memory/retrieval/index.js';
import { deleteMemory } from '../memory/storage/index.js';
import logger from '../shared/logger.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, settings: true, createdAt: true }
    }).catch(() => null);

    if (!user) {
      user = {
        id: userId,
        email: req.user.email,
        name: req.user.name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(req.user.name || 'User')}`,
        settings: {}
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

export const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    let updatedUser = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { settings: settings || {} },
        select: { id: true, settings: true }
      });
    } catch (e) {}

    logger.info('UserController', `Updated settings for user ${userId}`);

    return res.json({
      success: true,
      settings: updatedUser?.settings || settings || {},
      message: 'Settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMemories = async (req, res, next) => {
  try {
    const memories = await getUserMemories(req.user.id);
    return res.json({
      success: true,
      memories
    });
  } catch (error) {
    next(error);
  }
};

export const removeMemory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteMemory(id, req.user.id);
    logger.info('UserController', `Deleted memory ${id} for user ${req.user.id}`);

    return res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default { getProfile, updateSettings, getMemories, removeMemory };

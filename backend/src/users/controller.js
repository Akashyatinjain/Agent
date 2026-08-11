import prisma from '../db/client.js';
import getUserMemories from '../memory/retrieval/index.js';
import { deleteMemory } from '../memory/storage/index.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, avatar: true, settings: true, createdAt: true }
      });
    } catch (e) {}

    if (!user) {
      user = { id: userId, email: req.user.email, name: req.user.name };
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { settings }
      });
    } catch (e) {}

    return res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

export const getMemories = async (req, res, next) => {
  try {
    const memories = await getUserMemories(req.user.id);
    return res.json({ success: true, memories });
  } catch (error) {
    next(error);
  }
};

export const removeMemory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteMemory(id, req.user.id);
    return res.json({ success: true, message: 'Memory deleted' });
  } catch (error) {
    next(error);
  }
};

export default { getProfile, updateSettings, getMemories, removeMemory };

import prisma from '../../db/client.js';

export const saveMemory = async ({ userId, fact, category = 'general' }) => {
  try {
    return await prisma.memory.create({
      data: {
        userId,
        fact,
        category
      }
    });
  } catch (err) {
    console.warn('Save memory warning:', err.message);
    return null;
  }
};

export const deleteMemory = async (memoryId, userId) => {
  try {
    await prisma.memory.deleteMany({
      where: { id: memoryId, userId }
    });
    return true;
  } catch (err) {
    return false;
  }
};

export default { saveMemory, deleteMemory };

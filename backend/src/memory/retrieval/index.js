import prisma from '../../db/client.js';

export const getUserMemories = async (userId) => {
  try {
    return await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  } catch (err) {
    return [];
  }
};

export default getUserMemories;

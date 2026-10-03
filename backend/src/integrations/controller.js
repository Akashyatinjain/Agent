import prisma from '../db/client.js';
import env from '../config/env.js';

export const getConnectedChannels = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const channels = await prisma.userChannel.findMany({
      where: { userId }
    });

    const botUsername = env.TELEGRAM_BOT_USERNAME || 'AkashAgentBot';

    res.json({
      success: true,
      channels: channels.map(ch => ({
        id: ch.id,
        channelType: ch.channelType,
        channelUserId: ch.isVerified ? ch.channelUserId : null,
        channelUsername: ch.channelUsername,
        isVerified: ch.isVerified,
        hasActiveCode: Boolean(ch.linkingCode && ch.linkingCodeExpiresAt && new Date(ch.linkingCodeExpiresAt) > new Date()),
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt
      })),
      telegram: {
        isConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
        botUsername,
        botUrl: `https://t.me/${botUsername}`
      },
      whatsapp: {
        isConfigured: Boolean(env.WHATSAPP_PHONE_NUMBER || env.WHATSAPP_ACCOUNT_SID),
        phoneNumber: env.WHATSAPP_PHONE_NUMBER || null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const startChannelLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelType } = req.body;

    const normalizedType = (channelType || '').toUpperCase();
    if (!['TELEGRAM', 'WHATSAPP'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid channel type. Supported: TELEGRAM, WHATSAPP' }
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const existing = await prisma.userChannel.findFirst({
      where: { userId, channelType: normalizedType }
    });

    if (existing) {
      await prisma.userChannel.update({
        where: { id: existing.id },
        data: {
          linkingCode: code,
          linkingCodeExpiresAt: expiresAt
        }
      });
    } else {
      await prisma.userChannel.create({
        data: {
          userId,
          channelType: normalizedType,
          channelUserId: `pending_${userId}`,
          linkingCode: code,
          linkingCodeExpiresAt: expiresAt,
          isVerified: false
        }
      });
    }

    const botUsername = env.TELEGRAM_BOT_USERNAME || 'AkashAgentBot';
    const waPhone = (env.WHATSAPP_PHONE_NUMBER || '+14155238886').replace(/[^0-9]/g, '');
    const deepLink = normalizedType === 'TELEGRAM'
      ? `https://t.me/${botUsername}?start=${code}`
      : `https://wa.me/${waPhone}?text=link%20${code}`;

    res.json({
      success: true,
      code,
      channelType: normalizedType,
      expiresInMinutes: 15,
      deepLink,
      botUsername,
      instruction: normalizedType === 'TELEGRAM'
        ? `Open Telegram and tap 'Start' or send /link ${code}`
        : `Send 'link ${code}' to our WhatsApp assistant`
    });
  } catch (error) {
    next(error);
  }
};

export const disconnectChannel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelType } = req.params;
    const normalizedType = (channelType || '').toUpperCase();

    await prisma.userChannel.deleteMany({
      where: { userId, channelType: normalizedType }
    });

    res.json({
      success: true,
      message: `${normalizedType} disconnected successfully.`
    });
  } catch (error) {
    next(error);
  }
};

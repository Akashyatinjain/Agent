import prisma from '../db/client.js';
import logger from '../shared/logger.js';
import env from '../config/env.js';
import { routeAndExecute } from '../ai/router/index.js';

let isPolling = false;
let pollingAbortController = null;

export const sendTelegramMessage = async (botToken, chatId, text) => {
  if (!botToken || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    if (!res.ok) {
      // Retry without markdown if parsing failed
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true
        })
      });
    }
  } catch (err) {
    logger.error('TelegramBot', `Failed to send message: ${err.message}`);
  }
};

export const sendChatAction = async (botToken, chatId, action = 'typing') => {
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action })
    });
  } catch (e) {
    // ignore
  }
};

export const handleTelegramUpdate = async (botToken, update) => {
  const message = update?.message;
  if (!message) return;

  const chatId = message.chat?.id;
  if (!chatId) return;

  const text = (message.text || '').trim();
  const username = message.from?.username || message.from?.first_name || '';

  // 1. Handle /start [code]
  if (text.startsWith('/start')) {
    const parts = text.split(/\s+/);
    if (parts.length > 1 && /^\d{6}$/.test(parts[1])) {
      await processLinking(botToken, chatId, parts[1], username);
      return;
    }

    const linked = await prisma.userChannel.findFirst({
      where: { channelUserId: String(chatId), channelType: 'TELEGRAM', isVerified: true },
      include: { user: true }
    });

    if (linked) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `👋 *Welcome back, ${linked.user.name}!*\n\nI am ready. Ask me anything, inquire about your uploaded files, or chat freely!`
      );
    } else {
      await sendTelegramMessage(
        botToken,
        chatId,
        `👋 *Hello, ${message.from?.first_name || 'Friend'}! Welcome to AkashAgent AI.*\n\n` +
        `To link this chat with your Web account and access your uploaded documents & personal memory bank, run:\n` +
        `👉 \`/link <6-DIGIT-CODE>\`\n\n` +
        `_(Generate your code on the Web App in Settings $\\rightarrow$ Omnichannel Assistant)_`
      );
    }
    return;
  }

  // 2. Handle /link <code>
  if (text.startsWith('/link')) {
    const parts = text.split(/\s+/);
    if (parts.length > 1 && /^\d{6}$/.test(parts[1])) {
      await processLinking(botToken, chatId, parts[1], username);
    } else {
      await sendTelegramMessage(
        botToken,
        chatId,
        'ℹ️ *Usage:* Send `/link <6-DIGIT-CODE>` generated in your Web App settings.'
      );
    }
    return;
  }

  // 3. Handle 6-digit code sent directly without /link
  if (/^\d{6}$/.test(text)) {
    await processLinking(botToken, chatId, text, username);
    return;
  }

  // 4. Handle regular chat queries
  if (text) {
    await sendChatAction(botToken, chatId, 'typing');
    const linked = await prisma.userChannel.findFirst({
      where: { channelUserId: String(chatId), channelType: 'TELEGRAM', isVerified: true },
      include: { user: true }
    });

    const userId = linked?.user?.id || `telegram_guest_${chatId}`;

    try {
      const result = await routeAndExecute({
        userMessage: text,
        userId,
        history: [],
        provider: 'gemini'
      });

      let responseText = result?.response || 'No response generated.';
      if (!linked) {
        responseText += '\n\n---\n💡 _Tip: Link your Web account using /link <CODE> to enable document retrieval & memory!_';
      }

      await sendTelegramMessage(botToken, chatId, responseText);
    } catch (err) {
      logger.error('TelegramBot', `Error generating response: ${err.message}`);
      await sendTelegramMessage(botToken, chatId, '⚠️ An error occurred while generating response. Please try again.');
    }
  }
};

const processLinking = async (botToken, chatId, code, username) => {
  const now = new Date();
  const channel = await prisma.userChannel.findFirst({
    where: {
      channelType: 'TELEGRAM',
      linkingCode: code,
      linkingCodeExpiresAt: { gt: now }
    },
    include: { user: true }
  });

  if (!channel) {
    await sendTelegramMessage(
      botToken,
      chatId,
      '❌ *Invalid or Expired Code*\n\nThe code has expired or is invalid. Please generate a fresh code on the Web App.'
    );
    return;
  }

  // Unlink any previous entries for this chatId
  await prisma.userChannel.deleteMany({
    where: {
      channelType: 'TELEGRAM',
      channelUserId: String(chatId),
      id: { not: channel.id }
    }
  });

  await prisma.userChannel.update({
    where: { id: channel.id },
    data: {
      channelUserId: String(chatId),
      channelUsername: username,
      isVerified: true,
      linkingCode: null,
      linkingCodeExpiresAt: null
    }
  });

  await sendTelegramMessage(
    botToken,
    chatId,
    `🎉 *Account Linked Successfully!*\n\n` +
    `Welcome, *${channel.user.name}*! Your Telegram is now connected to *${channel.user.email}*.\n\n` +
    `✨ *What you can do:*\n` +
    `• 📄 Ask questions about any documents or resumes you uploaded on the Web\n` +
    `• 🧠 All facts and memories are unified across Web and Telegram\n` +
    `• 🔍 Ask live weather, calculations, or web research`
  );
};

export const startTelegramPoller = async () => {
  const botToken = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    logger.info('TelegramBot', 'TELEGRAM_BOT_TOKEN not set in environment. Poller is idle.');
    return;
  }

  if (isPolling) return;
  isPolling = true;

  logger.info('TelegramBot', '🚀 Starting Telegram long-polling listener...');

  // Delete webhook so polling works without conflict
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, { method: 'POST' });
  } catch (e) {
    // ignore
  }

  let offset = 0;
  pollingAbortController = new AbortController();

  const pollLoop = async () => {
    while (isPolling) {
      try {
        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=25`;
        const res = await fetch(url, { signal: pollingAbortController.signal });

        if (res.ok) {
          const data = await res.json();
          const updates = data.result || [];

          for (const update of updates) {
            offset = Math.max(offset, (update.update_id || 0) + 1);
            await handleTelegramUpdate(botToken, update);
          }
        } else if (res.status === 409) {
          await new Promise(r => setTimeout(r, 4000));
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err) {
        if (err.name === 'AbortError') break;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  };

  pollLoop();
};

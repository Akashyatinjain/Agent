import prisma from '../db/client.js';
import routeAndExecute from '../ai/router/index.js';
import setupSSEStream from '../ai/streaming/sse.js';
import extractMemoriesFromConversation from '../memory/extraction/index.js';
import { saveMemory } from '../memory/storage/index.js';

export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, message, model = 'gemini', isStream = true } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    let activeConversationId = conversationId;

    const formatTitle = (msg) => {
      const clean = msg.trim();
      if (!clean) return 'New Conversation';
      const firstLine = clean.split('\n')[0];
      if (firstLine.length <= 35) return firstLine;
      return firstLine.substring(0, 35).trim() + '...';
    };

    // Create a new conversation if not passed
    if (!activeConversationId) {
      try {
        const newConv = await prisma.conversation.create({
          data: {
            title: formatTitle(message),
            userId,
            model
          }
        });
        activeConversationId = newConv.id;
      } catch (e) {
        activeConversationId = `conv-${Date.now()}`;
      }
    }

    // Fetch conversation history
    let history = [];
    try {
      const pastMessages = await prisma.message.findMany({
        where: { conversationId: activeConversationId },
        orderBy: { createdAt: 'asc' },
        take: 10
      });
      history = pastMessages.map((m) => ({ role: m.role, content: m.content }));
    } catch (e) {
      // Fallback empty history
    }

    // Save user message to database
    try {
      await prisma.message.create({
        data: {
          role: 'user',
          content: message,
          conversationId: activeConversationId
        }
      });
    } catch (e) {
      // Continue if DB unavailable
    }

    if (isStream) {
      const { sendEvent, closeStream } = setupSSEStream(res);

      sendEvent('metadata', { conversationId: activeConversationId });

      const { response: fullResponseText, metadata } = await routeAndExecute({
        userMessage: message,
        userId,
        provider: model,
        history,
        onMetaData: (meta) => {
          sendEvent('router_intent', meta);
        },
        onChunk: (chunk) => {
          sendEvent('token', { chunk });
        }
      });

      // Save assistant message to database
      try {
        await prisma.message.create({
          data: {
            role: 'assistant',
            content: fullResponseText,
            conversationId: activeConversationId,
            model,
            routerType: metadata.pipeline,
            toolCalls: metadata.toolResults ? JSON.stringify(metadata.toolResults) : null,
            ragContext: metadata.ragChunks ? JSON.stringify(metadata.ragChunks) : null
          }
        });
        await prisma.conversation.update({
          where: { id: activeConversationId },
          data: { updatedAt: new Date() }
        });
      } catch (e) {}

      // Async memory extraction
      extractMemoriesFromConversation(message, fullResponseText).then((extracted) => {
        if (extracted.hasFact) {
          saveMemory({ userId, fact: extracted.fact, category: extracted.category });
        }
      });

      closeStream();
    } else {
      const { response: fullResponseText, metadata } = await routeAndExecute({
        userMessage: message,
        userId,
        provider: model,
        history
      });

      // Save assistant response
      try {
        await prisma.message.create({
          data: {
            role: 'assistant',
            content: fullResponseText,
            conversationId: activeConversationId,
            model,
            routerType: metadata.pipeline
          }
        });
      } catch (e) {}

      return res.json({
        success: true,
        conversationId: activeConversationId,
        response: fullResponseText,
        metadata
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let conversations = [];
    try {
      conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (e) {
      conversations = [
        {
          id: 'demo-conv-1',
          title: 'Welcome to MiniGPT',
          model: 'gemini',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [{ content: 'Hello! I am your AI assistant.' }]
        }
      ];
    }
    return res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let conversation = null;
    try {
      conversation = await prisma.conversation.findFirst({
        where: { id, userId: req.user.id },
        include: {
          messages: { orderBy: { createdAt: 'asc' } }
        }
      });
    } catch (e) {}

    if (!conversation) {
      conversation = {
        id,
        title: 'New Conversation',
        messages: []
      };
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await prisma.conversation.deleteMany({
        where: { id, userId: req.user.id }
      });
    } catch (e) {}
    return res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export default {
  sendMessage,
  getConversations,
  getConversationById,
  deleteConversation
};

import prisma from '../db/client.js';
import routeAndExecute from '../ai/router/index.js';
import setupSSEStream from '../ai/streaming/sse.js';
import extractMemoriesFromConversation from '../memory/extraction/index.js';
import { saveMemory } from '../memory/storage/index.js';
import logger from '../shared/logger.js';

export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, message, model = 'gemini', isStream = true, attachedFile = null } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_MESSAGE',
          message: 'Message content is required.'
        }
      });
    }

    const cleanMessage = message.trim();
    let activeConversationId = conversationId;

    const generateTitle = (msg) => {
      const firstLine = msg.split('\n')[0].trim();
      return firstLine.length > 36 ? firstLine.slice(0, 36).trim() + '...' : firstLine;
    };

    // Create or retrieve conversation
    if (!activeConversationId) {
      try {
        const newConv = await prisma.conversation.create({
          data: {
            title: attachedFile?.name ? `📄 ${attachedFile.name}` : generateTitle(cleanMessage),
            userId,
            model
          }
        });
        activeConversationId = newConv.id;
      } catch (convErr) {
        logger.warn('ChatController', 'Prisma create conversation fallback:', { error: convErr.message });
        activeConversationId = `conv-${Date.now()}`;
      }
    }

    // Retrieve conversation history for context
    let history = [];
    try {
      const pastMessages = await prisma.message.findMany({
        where: { conversationId: activeConversationId },
        orderBy: { createdAt: 'asc' },
        take: 20
      });
      history = pastMessages.map((m) => ({
        role: (m.role || '').toLowerCase() === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));
    } catch (e) {
      logger.warn('ChatController', 'Failed to retrieve conversation history:', { error: e.message });
      history = [];
    }

    // Persist incoming user message with attached document metadata
    try {
      await prisma.message.create({
        data: {
          role: 'USER',
          content: cleanMessage,
          conversationId: activeConversationId,
          ragContext: attachedFile ? JSON.stringify({ attachedFile }) : null
        }
      });
    } catch (e) {
      logger.error('ChatController', 'Failed to save user message to DB:', { error: e.message });
    }

    if (isStream) {
      const { sendEvent, sendError, closeStream } = setupSSEStream(res);

      sendEvent('metadata', {
        conversationId: activeConversationId,
        model
      });

      try {
        const { response: fullResponseText, metadata } = await routeAndExecute({
          userMessage: cleanMessage,
          userId,
          provider: model,
          history,
          attachedFile,
          onMetaData: (meta) => {
            sendEvent('router_intent', meta);
          },
          onChunk: (chunk) => {
            sendEvent('token', { chunk });
          }
        });

        // Persist assistant message with rich metadata
        try {
          await prisma.message.create({
            data: {
              role: 'ASSISTANT',
              content: fullResponseText,
              conversationId: activeConversationId,
              model,
              routerType: metadata?.pipeline,
              toolCalls: metadata?.toolResults && metadata.toolResults.length > 0 ? JSON.stringify(metadata.toolResults) : null,
              ragContext: metadata?.ragChunks && metadata.ragChunks.length > 0 ? JSON.stringify(metadata.ragChunks) : null
            }
          });

          await prisma.conversation.update({
            where: { id: activeConversationId },
            data: { updatedAt: new Date() }
          }).catch(() => { });
        } catch (dbErr) {
          logger.error('ChatController', 'Failed to save assistant message:', { error: dbErr.message });
        }

        // Asynchronously extract personal user facts/preferences to memory bank
        extractMemoriesFromConversation(cleanMessage, fullResponseText)
          .then((extracted) => {
            if (extracted?.hasFact && extracted.fact) {
              saveMemory({ userId, fact: extracted.fact, category: extracted.category || 'general' });
            }
          })
          .catch(() => { });

        closeStream();
      } catch (streamErr) {
        logger.error('ChatController', 'Streaming execution error:', { error: streamErr.message });
        sendError(streamErr);
        closeStream();
      }
    } else {
      const { response: fullResponseText, metadata } = await routeAndExecute({
        userMessage: cleanMessage,
        userId,
        provider: model,
        history,
        attachedFile
      });

      try {
        await prisma.message.create({
          data: {
            role: 'ASSISTANT',
            content: fullResponseText,
            conversationId: activeConversationId,
            model,
            routerType: metadata?.pipeline,
            toolCalls: metadata?.toolResults ? JSON.stringify(metadata.toolResults) : null,
            ragContext: metadata?.ragChunks ? JSON.stringify(metadata.ragChunks) : null
          }
        });
      } catch (e) {
        logger.error('ChatController', 'Failed to save non-stream assistant message:', { error: e.message });
      }

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

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    return res.json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    }).catch(() => null);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or has been deleted.'
        }
      });
    }

    const normalizedConversation = {
      ...conversation,
      messages: (conversation.messages || []).map((m) => ({
        ...m,
        role: (m.role || '').toLowerCase()
      }))
    };

    return res.json({
      success: true,
      conversation: normalizedConversation
    });
  } catch (error) {
    next(error);
  }
};

export const renameConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TITLE', message: 'Conversation title is required.' }
      });
    }

    const updated = await prisma.conversation.updateMany({
      where: { id, userId },
      data: { title: title.trim().slice(0, 80) }
    }).catch(() => null);

    return res.json({
      success: true,
      title: title.trim(),
      message: 'Conversation renamed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.conversation.deleteMany({
      where: { id, userId }
    }).catch(() => { });

    logger.info('ChatController', `Deleted conversation: ${id}`, { userId });

    return res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  sendMessage,
  getConversations,
  getConversationById,
  renameConversation,
  deleteConversation
};

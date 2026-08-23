import classifyUserIntent from './classifier.js';
import generateLLMResponse from '../llm/provider.js';
import SYSTEM_PROMPTS from '../prompts/system.js';
import { retrieveRelevantChunks } from '../../rag/retrieval/index.js';
import { rerankChunks } from '../../rag/reranking/index.js';
import { executeTools } from '../../tools/registry/index.js';
import getUserMemories from '../../memory/retrieval/index.js';
import { getInMemoryFiles } from '../../rag/store.js';
import prisma from '../../db/client.js';
import { ROUTER_TYPES } from '../../shared/constants.js';
import logger from '../../shared/logger.js';

export const routeAndExecute = async ({
  userMessage,
  userId,
  provider = 'gemini',
  history = [],
  attachedFile = null,
  onChunk = null,
  onMetaData = null
}) => {
  const startTime = Date.now();
  logger.info('Router', `Classifying incoming message for user ${userId}...`);

  // Step 1: Intelligent Intent Classification
  const classification = await classifyUserIntent(userMessage);
  let pipeline = classification.pipeline || ROUTER_TYPES.CHAT;

  // If user explicitly attached a document to this message, ensure pipeline runs RAG
  if (attachedFile?.id) {
    pipeline = pipeline === ROUTER_TYPES.TOOL ? ROUTER_TYPES.HYBRID : ROUTER_TYPES.RAG;
  }

  if (onMetaData) {
    onMetaData({
      routerType: pipeline,
      reasoning: classification.reasoning,
      toolsUsed: classification.toolsNeeded,
      ragQuery: classification.ragQuery,
      attachedFile
    });
  }

  // Fetch list of user's uploaded files so AI is always aware of their documents
  let userUploadedFiles = [];
  try {
    const dbFiles = await prisma.file.findMany({
      where: { userId },
      select: { id: true, name: true, size: true, chunkCount: true },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);
    const memFiles = getInMemoryFiles(userId);
    const map = new Map();
    memFiles.forEach((f) => map.set(f.id, f));
    dbFiles.forEach((f) => map.set(f.id, f));
    userUploadedFiles = Array.from(map.values());
  } catch (e) {}

  let ragContextText = '';
  let ragChunks = [];
  let toolResults = [];

  // Step 2: RAG Pipeline Execution (executed if RAG, HYBRID, or if user has uploaded files & query is relevant)
  if (
    pipeline === ROUTER_TYPES.RAG ||
    pipeline === ROUTER_TYPES.HYBRID ||
    attachedFile?.id ||
    userUploadedFiles.length > 0
  ) {
    try {
      const queryToSearch = classification.ragQuery || userMessage;
      const targetFileId = attachedFile?.id || null;

      const rawChunks = await retrieveRelevantChunks({
        query: queryToSearch,
        userId,
        fileId: targetFileId,
        topK: 6,
        minSimilarity: 0.15
      });

      if (rawChunks.length > 0) {
        const reranked = rerankChunks(rawChunks, queryToSearch);
        ragChunks = reranked.slice(0, 5);

        ragContextText = ragChunks
          .map((c, i) => {
            const filename = c.metadata?.filename || 'Document';
            const pageInfo = c.metadata?.pageNumber ? ` (Page ${c.metadata.pageNumber})` : '';
            return `[Source ${i + 1}: ${filename}${pageInfo}]\n${c.content}`;
          })
          .join('\n\n');
      }
    } catch (ragErr) {
      logger.warn('Router', 'RAG retrieval warning:', { error: ragErr.message });
    }
  }

  // Step 3: Tool Pipeline Execution (executed if TOOL or HYBRID is requested)
  if (pipeline === ROUTER_TYPES.TOOL || pipeline === ROUTER_TYPES.HYBRID) {
    try {
      const toolsToRun = Array.isArray(classification.toolsNeeded) && classification.toolsNeeded.length > 0
        ? classification.toolsNeeded
        : ['web_search'];

      toolResults = await executeTools(toolsToRun, userMessage);
    } catch (toolErr) {
      logger.warn('Router', 'Tool execution warning:', { error: toolErr.message });
    }
  }

  // Step 4: Inject User Memories if available
  let userMemories = [];
  try {
    userMemories = await getUserMemories(userId);
  } catch (memErr) {
    logger.debug('Router', 'User memories query skipped:', { error: memErr.message });
  }

  let memoryContextText = '';
  if (userMemories.length > 0) {
    memoryContextText = `USER PROFILE & REMEMBERED FACTS:\n` +
      userMemories.map((m) => `- [${m.category.toUpperCase()}]: ${m.fact}`).join('\n');
  }

  // Step 5: Assemble Unified System Prompt
  let systemPrompt = SYSTEM_PROMPTS.GENERAL;

  // Add list of user's active uploaded documents
  if (userUploadedFiles.length > 0) {
    const fileListText = userUploadedFiles
      .map((f) => `- "${f.name}" (${(f.size / 1024).toFixed(1)} KB, ${f.chunkCount || 0} chunks indexed)`)
      .join('\n');
    systemPrompt += `\n\nUSER'S UPLOADED DOCUMENTS IN KNOWLEDGE BASE:\n${fileListText}\nYou have full access to these documents through the pgvector RAG pipeline. When the user asks about their resume, uploaded files, or documents, reference their contents directly.`;
  }

  if (memoryContextText) {
    systemPrompt += `\n\n${memoryContextText}`;
  }

  if (ragContextText) {
    systemPrompt += `\n\n${SYSTEM_PROMPTS.RAG_CONTEXT.replace('{{ragContext}}', ragContextText)}`;
  }

  if (toolResults.length > 0) {
    const formattedToolData = toolResults.map((t) => ({
      tool: t.tool,
      success: t.success,
      data: t.result !== undefined ? t.result : (t.results || t.temperature || t.error || 'Execution completed')
    }));
    systemPrompt += `\n\n${SYSTEM_PROMPTS.TOOL_CONTEXT.replace('{{toolContext}}', JSON.stringify(formattedToolData, null, 2))}`;
  }

  // Step 6: Stream Final Multi-Provider LLM Response
  const finalResponseText = await generateLLMResponse({
    provider,
    prompt: userMessage,
    systemPrompt,
    history,
    onChunk
  });

  const durationMs = Date.now() - startTime;
  logger.info('Router', `Completed routing and execution via [${pipeline}] pipeline in ${durationMs}ms`);

  return {
    response: finalResponseText,
    metadata: {
      pipeline,
      reasoning: classification.reasoning,
      ragChunks,
      toolResults,
      memoriesUsed: userMemories.length,
      attachedFile,
      durationMs
    }
  };
};

export default routeAndExecute;

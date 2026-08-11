import classifyUserIntent from './classifier.js';
import generateLLMResponse from '../llm/provider.js';
import SYSTEM_PROMPTS from '../prompts/system.js';
import { retrieveRelevantChunks } from '../../rag/retrieval/index.js';
import { rerankChunks } from '../../rag/reranking/index.js';
import { executeTools } from '../../tools/registry/index.js';
import getUserMemories from '../../memory/retrieval/index.js';
import { ROUTER_TYPES } from '../../shared/constants.js';

export const routeAndExecute = async ({
  userMessage,
  userId,
  provider = 'gemini',
  history = [],
  onChunk = null,
  onMetaData = null
}) => {
  // Step 1: Intelligent Intent Classification
  const classification = await classifyUserIntent(userMessage);
  const pipeline = classification.pipeline;

  if (onMetaData) {
    onMetaData({
      routerType: pipeline,
      reasoning: classification.reasoning,
      toolsUsed: classification.toolsNeeded,
      ragQuery: classification.ragQuery
    });
  }

  let ragContextText = '';
  let ragChunks = [];
  let toolResults = [];

  // Step 2: RAG Pipeline Execution if pipeline is 'rag' or 'hybrid'
  if (pipeline === ROUTER_TYPES.RAG || pipeline === ROUTER_TYPES.HYBRID) {
    const rawChunks = await retrieveRelevantChunks({
      query: classification.ragQuery || userMessage,
      userId,
      topK: 5
    });
    ragChunks = rerankChunks(rawChunks, userMessage);
    if (ragChunks.length > 0) {
      ragContextText = ragChunks.map((c, i) => `[Chunk ${i + 1} (${c.metadata?.filename || 'Document'})]:\n${c.content}`).join('\n\n');
    }
  }

  // Step 3: Tool Pipeline Execution if pipeline is 'tool' or 'hybrid'
  if (pipeline === ROUTER_TYPES.TOOL || pipeline === ROUTER_TYPES.HYBRID) {
    const toolsToRun = classification.toolsNeeded.length > 0 ? classification.toolsNeeded : ['web_search'];
    toolResults = await executeTools(toolsToRun, userMessage);
  }

  // Step 4: Inject User Memories if available
  const userMemories = await getUserMemories(userId);
  let memoryContextText = '';
  if (userMemories.length > 0) {
    memoryContextText = `USER MEMORIES:\n` + userMemories.map((m) => `- ${m.fact}`).join('\n');
  }

  // Step 5: Synthesize System Prompt
  let systemPrompt = SYSTEM_PROMPTS.GENERAL;

  if (memoryContextText) {
    systemPrompt += `\n\n${memoryContextText}`;
  }

  if (ragContextText) {
    systemPrompt += `\n\n${SYSTEM_PROMPTS.RAG_CONTEXT.replace('{{ragContext}}', ragContextText)}`;
  }

  if (toolResults.length > 0) {
    const toolText = JSON.stringify(toolResults, null, 2);
    systemPrompt += `\n\n${SYSTEM_PROMPTS.TOOL_CONTEXT.replace('{{toolContext}}', toolText)}`;
  }

  // Step 6: Generate Final LLM Streamed Response
  const finalResponseText = await generateLLMResponse({
    provider,
    prompt: userMessage,
    systemPrompt,
    history,
    onChunk
  });

  return {
    response: finalResponseText,
    metadata: {
      pipeline,
      reasoning: classification.reasoning,
      ragChunks,
      toolResults,
      memoriesUsed: userMemories.length
    }
  };
};

export default routeAndExecute;

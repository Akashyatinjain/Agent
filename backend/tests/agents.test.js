import { test, describe } from 'node:test';
import assert from 'node:assert';
import { classifyUserIntent } from '../src/ai/router/classifier.js';
import { routeAndExecute } from '../src/ai/router/index.js';
import { ROUTER_TYPES, TOOL_NAMES } from '../src/shared/constants.js';

describe('AI Agent & Router Pipeline Tests', () => {
  describe('Intent Classifier', () => {
    test('Correctly routes calculation requests to tool pipeline', async () => {
      const res = await classifyUserIntent('Calculate 125 * 4');
      assert.strictEqual(res.pipeline, ROUTER_TYPES.TOOL);
      assert.ok(res.toolsNeeded.includes(TOOL_NAMES.CALCULATOR));
    });

    test('Correctly routes weather queries to tool pipeline', async () => {
      const res = await classifyUserIntent('What is the weather in Tokyo?');
      assert.strictEqual(res.pipeline, ROUTER_TYPES.TOOL);
      assert.ok(res.toolsNeeded.includes(TOOL_NAMES.WEATHER));
    });

    test('Correctly routes web search queries to tool pipeline', async () => {
      const res = await classifyUserIntent('Search latest news about tech startups');
      assert.strictEqual(res.pipeline, ROUTER_TYPES.TOOL);
      assert.ok(res.toolsNeeded.includes(TOOL_NAMES.WEB_SEARCH));
    });

    test('Correctly routes document queries to RAG pipeline', async () => {
      const res = await classifyUserIntent('Summarize what is written in my uploaded notes');
      assert.strictEqual(res.pipeline, ROUTER_TYPES.RAG);
      assert.ok(res.ragQuery);
    });

    test('Defaults general questions to direct chat pipeline', async () => {
      const res = await classifyUserIntent('Tell me a short story about a time traveler');
      assert.strictEqual(res.pipeline, ROUTER_TYPES.CHAT);
    });
  });

  describe('Agent Orchestration & Execution', () => {
    test('Executes end-to-end routing with tool execution and returns structured response', async () => {
      const chunks = [];
      const result = await routeAndExecute({
        userMessage: 'Calculate 50 * 50',
        userId: 'test-user-123',
        provider: 'gemini',
        onChunk: (chunk) => chunks.push(chunk)
      });

      assert.ok(result.response);
      assert.ok(result.metadata);
      assert.strictEqual(result.metadata.pipeline, ROUTER_TYPES.TOOL);
      assert.ok(Array.isArray(result.metadata.toolResults));
      assert.strictEqual(result.metadata.toolResults[0].tool, 'calculator');
      assert.strictEqual(result.metadata.toolResults[0].result, 2500);
    });
  });
});

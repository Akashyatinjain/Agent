import { test, describe } from 'node:test';
import assert from 'node:assert';
import { executeCalculator } from '../src/tools/calculator/index.js';
import { executeWeather } from '../src/tools/weather/index.js';
import { executeWebSearch } from '../src/tools/web-search/index.js';
import { executeToolByName, executeTools } from '../src/tools/registry/index.js';

describe('Tool System Unit Tests', () => {
  describe('Calculator Tool (Safe Arithmetic Evaluator)', () => {
    test('Evaluates basic addition, subtraction, multiplication, division', async () => {
      const res = await executeCalculator('12 + 8 * 4 - 10 / 2');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.result, 39); // 12 + 32 - 5 = 39
    });

    test('Evaluates expressions with parentheses and decimal numbers', async () => {
      const res = await executeCalculator('(25.5 + 4.5) * 2');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.result, 60);
    });

    test('Extracts math from natural language sentences', async () => {
      const res = await executeCalculator('Please calculate 500 * 4');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.result, 2000);
    });

    test('Handles division by zero safely', async () => {
      const res = await executeCalculator('100 / 0');
      assert.strictEqual(res.success, false);
      assert.match(res.error, /Division by zero/i);
    });

    test('Rejects arbitrary code injection attempts', async () => {
      const res = await executeCalculator('process.exit(1); return 42');
      // Should sanitize or reject forbidden characters
      assert.ok(res.result !== 42 || res.success === false);
    });
  });

  describe('Weather Tool', () => {
    test('Extracts location from "weather in [City]" query', async () => {
      const res = await executeWeather('What is the weather in Paris?');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.tool, 'weather');
      assert.match(res.location, /Paris/i);
      assert.ok(res.temperature);
    });

    test('Extracts location from "[City] forecast" query', async () => {
      const res = await executeWeather('London weather forecast');
      assert.strictEqual(res.success, true);
      assert.match(res.location, /London/i);
    });
  });

  describe('Web Search Tool', () => {
    test('Normalizes search query and returns structured results', async () => {
      const res = await executeWebSearch('Search the web for artificial intelligence news');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.tool, 'web_search');
      assert.ok(Array.isArray(res.results));
      assert.ok(res.results.length > 0);
      assert.ok(res.results[0].title);
    });
  });

  describe('Tool Registry', () => {
    test('Dispatches tool by name correctly', async () => {
      const res = await executeToolByName('calculator', '15 + 15');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.result, 30);
      assert.ok(typeof res.durationMs === 'number');
    });

    test('Handles unregistered tool names gracefully', async () => {
      const res = await executeToolByName('nonexistent_tool', 'test query');
      assert.strictEqual(res.success, false);
      assert.match(res.error, /not registered/i);
    });

    test('Executes multiple tools in parallel', async () => {
      const results = await executeTools(['calculator', 'weather'], 'calculate 10 * 10 in Mumbai');
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].success, true);
      assert.strictEqual(results[1].success, true);
    });
  });
});

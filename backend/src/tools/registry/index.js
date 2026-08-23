import executeCalculator from '../calculator/index.js';
import executeWeather from '../weather/index.js';
import executeWebSearch from '../web-search/index.js';
import { TOOL_NAMES } from '../../shared/constants.js';
import logger from '../../shared/logger.js';

export const executeToolByName = async (toolName, query) => {
  const startTime = Date.now();
  try {
    let result;
    switch (toolName?.toLowerCase()) {
      case TOOL_NAMES.CALCULATOR:
      case 'math':
      case 'calc':
        result = await executeCalculator(query);
        break;

      case TOOL_NAMES.WEATHER:
      case 'forecast':
      case 'temperature':
        result = await executeWeather(query);
        break;

      case TOOL_NAMES.WEB_SEARCH:
      case 'search':
      case 'google':
      case 'web':
        result = await executeWebSearch(query);
        break;

      default:
        logger.warn('ToolRegistry', `Unrecognized tool requested: ${toolName}`);
        return {
          success: false,
          tool: toolName,
          error: `Tool "${toolName}" is not registered in MiniGPT registry.`
        };
    }

    const durationMs = Date.now() - startTime;
    return {
      ...result,
      durationMs
    };
  } catch (error) {
    logger.error('ToolRegistry', `Tool "${toolName}" threw unexpected error:`, { error: error.message });
    return {
      success: false,
      tool: toolName,
      error: `Execution error in tool ${toolName}: ${error.message}`,
      durationMs: Date.now() - startTime
    };
  }
};

export const executeTools = async (toolList = [], query) => {
  if (!Array.isArray(toolList) || toolList.length === 0) {
    return [];
  }

  // Deduplicate and cap tool executions to prevent infinite or slow loops
  const uniqueTools = Array.from(new Set(toolList)).slice(0, 3);
  
  // Execute tools concurrently with Promise.all
  const toolPromises = uniqueTools.map((name) => executeToolByName(name, query));
  const results = await Promise.all(toolPromises);
  
  return results;
};

export default { executeToolByName, executeTools };

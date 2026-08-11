import executeCalculator from '../calculator/index.js';
import executeWeather from '../weather/index.js';
import executeWebSearch from '../web-search/index.js';
import { TOOL_NAMES } from '../../shared/constants.js';

export const executeToolByName = async (toolName, query) => {
  switch (toolName) {
    case TOOL_NAMES.CALCULATOR:
      return await executeCalculator(query);
    case TOOL_NAMES.WEATHER:
      return await executeWeather(query);
    case TOOL_NAMES.WEB_SEARCH:
      return await executeWebSearch(query);
    default:
      return await executeWebSearch(query);
  }
};

export const executeTools = async (toolList = [], query) => {
  const results = [];
  for (const name of toolList) {
    const res = await executeToolByName(name, query);
    results.push(res);
  }
  return results;
};

export default { executeToolByName, executeTools };

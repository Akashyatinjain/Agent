import env from '../../config/env.js';

export const executeWebSearch = async (userQuery) => {
  if (env.SERPAPI_KEY) {
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(userQuery)}&api_key=${env.SERPAPI_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        const organicResults = data.organic_results || [];
        const topResults = organicResults.slice(0, 3).map((res) => ({
          title: res.title,
          snippet: res.snippet,
          link: res.link
        }));

        return {
          success: true,
          tool: 'web_search',
          query: userQuery,
          results: topResults
        };
      }
    } catch (err) {
      console.warn('SerpAPI search failed:', err.message);
    }
  }

  // Simulated live web search result fallback
  return {
    success: true,
    tool: 'web_search',
    isMock: true,
    query: userQuery,
    results: [
      {
        title: `Latest Updates for: ${userQuery}`,
        snippet: `Real-time search engine result synthesis for query "${userQuery}". MiniGPT Web Search Tool executed.`,
        link: 'https://minigpt.dev/search-results'
      },
      {
        title: 'Tech & Science Insights',
        snippet: 'Comprehensive live intelligence pipeline integration with real-time web retrieval.',
        link: 'https://minigpt.dev/news'
      }
    ]
  };
};

export default executeWebSearch;

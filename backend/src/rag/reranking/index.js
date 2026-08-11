/**
 * Re-rank retrieved document chunks by query keyword overlap & similarity score
 */
export const rerankChunks = (chunks, query) => {
  if (!chunks || chunks.length === 0) return [];

  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  const scored = chunks.map((chunk) => {
    let score = chunk.similarity || 0.5;
    const contentLower = chunk.content.toLowerCase();

    // Give bonus for query term frequency
    queryTerms.forEach((term) => {
      if (contentLower.includes(term)) {
        score += 0.1;
      }
    });

    return { ...chunk, rerankScore: Math.min(score, 1.0) };
  });

  return scored.sort((a, b) => b.rerankScore - a.rerankScore);
};

export default rerankChunks;

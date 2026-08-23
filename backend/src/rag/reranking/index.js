/**
 * Hybrid Semantic + Lexical Reranker for Retrieved Chunks
 */
export const rerankChunks = (chunks = [], query = '') => {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  if (!query || typeof query !== 'string') return chunks;

  const cleanQuery = query.toLowerCase().trim();
  const queryTerms = cleanQuery
    .split(/[\s,.;:!?\-+*/()]+/)
    .filter((t) => t.length > 2 && !['the', 'and', 'for', 'with', 'about', 'what', 'where', 'from', 'this', 'that'].includes(t));

  const scored = chunks.map((chunk) => {
    const baseSimilarity = typeof chunk.similarity === 'number' ? chunk.similarity : 0.5;
    const contentLower = (chunk.content || '').toLowerCase();

    let lexicalScore = 0;

    // 1. Exact query phrase match bonus
    if (cleanQuery.length > 4 && contentLower.includes(cleanQuery)) {
      lexicalScore += 0.25;
    }

    // 2. Query term frequency and distribution
    let matchedTermsCount = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        matchedTermsCount++;
        // Count occurrences up to 3 times
        const count = (contentLower.match(new RegExp(term, 'g')) || []).length;
        lexicalScore += Math.min(count * 0.05, 0.15);
      }
    }

    // Fraction of query terms present in chunk
    if (queryTerms.length > 0) {
      const termCoverage = matchedTermsCount / queryTerms.length;
      lexicalScore += termCoverage * 0.2;
    }

    // Combine: 60% semantic similarity + 40% lexical match
    const finalScore = (baseSimilarity * 0.6) + (Math.min(lexicalScore, 1.0) * 0.4);

    return {
      ...chunk,
      similarity: baseSimilarity,
      rerankScore: parseFloat(Math.min(finalScore, 1.0).toFixed(4))
    };
  });

  return scored.sort((a, b) => b.rerankScore - a.rerankScore);
};

export default rerankChunks;

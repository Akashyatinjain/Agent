/**
 * Recursive character text chunking algorithm
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  if (!text || typeof text !== 'string') return [];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < text.length) {
      // Find clean word / sentence boundary
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const lastSpace = text.lastIndexOf(' ', endIndex);

      const bestBoundary = Math.max(lastPeriod, lastNewline, lastSpace);
      if (bestBoundary > startIndex) {
        endIndex = bestBoundary + 1;
      }
    }

    const chunkContent = text.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= text.length || endIndex >= text.length) break;
  }

  return chunks;
};

export default chunkText;

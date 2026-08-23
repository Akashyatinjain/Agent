/**
 * Recursive Semantic Character & Paragraph Chunking Algorithm
 * Chunks text while preserving paragraph and sentence boundaries.
 */
export const chunkText = (
  text,
  chunkSize = 500,
  overlap = 60,
  minChunkSize = 40,
  maxChunks = 400
) => {
  if (!text || typeof text !== 'string') return [];

  // Normalize whitespace while preserving structural paragraph breaks
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();

  if (cleanText.length === 0) return [];

  // If entire document is smaller than chunk size, return single chunk
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  // Safety check on overlap
  const safeOverlap = Math.min(overlap, Math.floor(chunkSize * 0.4));
  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanText.length && chunks.length < maxChunks) {
    let endIndex = Math.min(startIndex + chunkSize, cleanText.length);

    if (endIndex < cleanText.length) {
      const slice = cleanText.substring(startIndex, endIndex);

      // Find optimal boundary: Paragraph break > Sentence end > Space
      const lastDoubleNewline = slice.lastIndexOf('\n\n');
      const lastNewline = slice.lastIndexOf('\n');
      const lastPeriod = slice.lastIndexOf('. ');
      const lastQuestion = slice.lastIndexOf('? ');
      const lastExclamation = slice.lastIndexOf('! ');
      const lastSpace = slice.lastIndexOf(' ');

      const sentenceBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
      const structuralBoundary = Math.max(lastDoubleNewline, lastNewline);

      let chosenBoundary = -1;
      if (structuralBoundary > chunkSize * 0.5) {
        chosenBoundary = structuralBoundary + 1;
      } else if (sentenceBoundary > chunkSize * 0.5) {
        chosenBoundary = sentenceBoundary + 1;
      } else if (lastSpace > chunkSize * 0.4) {
        chosenBoundary = lastSpace;
      }

      if (chosenBoundary > 0) {
        endIndex = startIndex + chosenBoundary;
      }
    }

    const chunkContent = cleanText.substring(startIndex, endIndex).trim();
    if (chunkContent.length >= minChunkSize) {
      chunks.push(chunkContent);
    }

    const nextStartIndex = endIndex - safeOverlap;
    if (nextStartIndex <= startIndex) {
      startIndex = endIndex;
    } else {
      startIndex = nextStartIndex;
    }
  }

  return chunks;
};

export default chunkText;

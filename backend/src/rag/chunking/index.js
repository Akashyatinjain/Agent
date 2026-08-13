/**
 * Recursive character text chunking algorithm
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  if (!text || typeof text !== 'string') return [];
  const cleanText = text.trim();
  if (!cleanText) return [];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = Math.min(startIndex + chunkSize, cleanText.length);

    if (endIndex < cleanText.length) {
      const slice = cleanText.substring(startIndex, endIndex);
      const lastPeriod = slice.lastIndexOf('.');
      const lastNewline = slice.lastIndexOf('\n');
      const lastSpace = slice.lastIndexOf(' ');

      const relativeBoundary = Math.max(lastPeriod, lastNewline, lastSpace);
      if (relativeBoundary > overlap) {
        endIndex = startIndex + relativeBoundary + 1;
      }
    }

    const chunkContent = cleanText.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    const nextStartIndex = endIndex - overlap;
    if (nextStartIndex <= startIndex) {
      startIndex = endIndex;
    } else {
      startIndex = nextStartIndex;
    }
  }

  return chunks;
};

export default chunkText;


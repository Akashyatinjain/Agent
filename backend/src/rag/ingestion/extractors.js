import pdfParse from 'pdf-parse';
import logger from '../../shared/logger.js';

/**
 * Text Extractor for Multiple Document Formats
 * Supports PDF, Markdown, Plain Text, JSON, CSV, and DOCX XML.
 */
export const extractTextFromFile = async (buffer, mimeType = '', filename = '') => {
  const lowerName = filename.toLowerCase();

  // 1. PDF Documents
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      const cleaned = (data.text || '').trim();
      if (cleaned.length > 0) {
        return cleaned;
      }
      throw new Error('PDF extracted text is empty');
    } catch (pdfErr) {
      logger.warn('Extractor', `PDF text parsing warning for ${filename}:`, { error: pdfErr.message });
      // Fallback: try raw ascii/utf-8 extraction for partial text streams
      const raw = buffer.toString('utf-8');
      const textMatches = raw.match(/[A-Za-z0-9\s.,!?:;'"()\-_/]{4,}/g);
      if (textMatches && textMatches.length > 10) {
        return textMatches.join(' ');
      }
      return 'PDF document content could not be converted to plain text.';
    }
  }

  // 2. JSON Files
  if (mimeType === 'application/json' || lowerName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return buffer.toString('utf-8');
    }
  }

  // 3. CSV / Tabular Files
  if (mimeType === 'text/csv' || lowerName.endsWith('.csv')) {
    const rawCsv = buffer.toString('utf-8');
    return rawCsv.trim();
  }

  // 4. DOCX Documents (Extract text nodes from internal XML structure)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const raw = buffer.toString('latin1');
    const xmlTextMatches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
    if (xmlTextMatches && xmlTextMatches.length > 0) {
      const extractedText = xmlTextMatches
        .map((tag) => tag.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (extractedText.length > 0) {
        return extractedText;
      }
    }
    // Fallback printable ascii
    const fallbackText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    return fallbackText.trim();
  }

  // 5. Default: Markdown, Text, HTML, or plain UTF-8
  return buffer.toString('utf-8').trim();
};

export default extractTextFromFile;

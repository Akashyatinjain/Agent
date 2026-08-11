import pdfParse from 'pdf-parse';

export const extractTextFromFile = async (buffer, mimeType, filename) => {
  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (e) {
      console.warn('PDF parsing error fallback to buffer string:', e.message);
      return buffer.toString('utf-8');
    }
  }

  // Plain text / markdown / JSON / CSV fallback
  return buffer.toString('utf-8');
};

export default extractTextFromFile;

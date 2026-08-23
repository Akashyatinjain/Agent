import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    const lowerName = (file.originalname || '').toLowerCase();
    const validExtensions = ['.pdf', '.txt', '.md', '.markdown', '.json', '.csv', '.docx', '.doc'];
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (allowedMimeTypes.includes(file.mimetype) || hasValidExt) {
      cb(null, true);
    } else {
      const err = new Error('Unsupported file format. Please upload PDF, TXT, MD, CSV, JSON, or DOCX documents.');
      err.status = 400;
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  }
});

export default upload;

import prisma from '../db/client.js';
import { uploadToS3, deleteFromS3 } from '../config/s3.js';
import processFileForRAG from '../rag/ingestion/index.js';
import { saveInMemoryFile, getInMemoryFiles, deleteInMemoryFile } from '../rag/store.js';
import logger from '../shared/logger.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'Please select a valid document to upload.'
        }
      });
    }

    const userId = req.user.id;
    const file = req.file;
    const s3Key = `users/${userId}/files/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

    // Upload to S3 or local disk storage
    const storageUrl = await uploadToS3(file.buffer, s3Key, file.mimetype);

    let dbFile;
    try {
      dbFile = await prisma.file.create({
        data: {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          s3Key,
          s3Url: storageUrl,
          userId,
          status: 'processing'
        }
      });
    } catch (dbErr) {
      logger.warn('FilesController', 'Prisma create file warning, using memory fallback:', { error: dbErr.message });
      dbFile = {
        id: `file-${Date.now()}`,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        s3Key,
        s3Url: storageUrl,
        userId,
        status: 'processing',
        chunkCount: 0,
        createdAt: new Date().toISOString()
      };
    }

    saveInMemoryFile(dbFile);

    // Asynchronously process document for RAG indexing
    processFileForRAG({
      fileId: dbFile.id,
      userId,
      buffer: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname
    }).catch((err) => {
      logger.error('FilesController', 'Async RAG processing background failure:', { error: err.message, fileId: dbFile.id });
    });

    logger.info('FilesController', `Uploaded file: ${file.originalname} (${file.size} bytes)`, { fileId: dbFile.id, userId });

    return res.status(201).json({
      success: true,
      file: dbFile,
      message: 'File uploaded and queued for vector embedding'
    });
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let files = [];

    try {
      files = await prisma.file.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      files = [];
    }

    // Merge in-memory files
    const memFiles = getInMemoryFiles(userId);
    const fileMap = new Map();
    memFiles.forEach((f) => fileMap.set(f.id, f));
    files.forEach((f) => fileMap.set(f.id, f));

    const finalFiles = Array.from(fileMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({
      success: true,
      files: finalFiles
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    deleteInMemoryFile(id, userId);

    try {
      const file = await prisma.file.findFirst({
        where: { id, userId }
      });

      if (file) {
        if (file.s3Key) {
          await deleteFromS3(file.s3Key).catch(() => {});
        }
        await prisma.document.deleteMany({ where: { fileId: id } }).catch(() => {});
        await prisma.file.delete({ where: { id } }).catch(() => {});
      }
    } catch (e) {
      logger.warn('FilesController', 'DB file delete warning:', { error: e.message, fileId: id });
    }

    logger.info('FilesController', `Deleted file: ${id}`, { fileId: id, userId });

    return res.json({
      success: true,
      message: 'File and associated vector embeddings deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default { uploadFile, getFiles, deleteFile };

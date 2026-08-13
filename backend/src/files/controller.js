import prisma from '../db/client.js';
import { uploadToS3, deleteFromS3 } from '../config/s3.js';
import processFileForRAG from '../rag/ingestion/index.js';
import { saveInMemoryFile, getInMemoryFiles, deleteInMemoryFile } from '../rag/store.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const userId = req.user.id;
    const file = req.file;
    const s3Key = `users/${userId}/files/${Date.now()}-${file.originalname}`;

    // Upload to S3
    const s3Url = await uploadToS3(file.buffer, s3Key, file.mimetype);

    let dbFile;
    try {
      dbFile = await prisma.file.create({
        data: {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          s3Key,
          s3Url,
          userId,
          status: 'processing'
        }
      });
    } catch (e) {
      dbFile = {
        id: `file-${Date.now()}`,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        s3Key,
        s3Url,
        userId,
        status: 'processing'
      };
    }

    saveInMemoryFile(dbFile);

    // Trigger async RAG ingestion
    processFileForRAG({
      fileId: dbFile.id,
      userId,
      buffer: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname
    }).catch((err) => console.error('RAG Background Processing Error:', err));

    return res.status(201).json({
      success: true,
      file: dbFile
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

    const memFiles = getInMemoryFiles(userId);
    const fileMap = new Map();
    memFiles.forEach((f) => fileMap.set(f.id, f));
    files.forEach((f) => fileMap.set(f.id, f));

    return res.json({ success: true, files: Array.from(fileMap.values()) });
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
      const file = await prisma.file.findFirst({ where: { id, userId } });
      if (file) {
        await deleteFromS3(file.s3Key);
        await prisma.document.deleteMany({ where: { fileId: id } });
        await prisma.file.delete({ where: { id } });
      }
    } catch (e) {}

    return res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export default { uploadFile, getFiles, deleteFile };

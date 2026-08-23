import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';
import logger from '../shared/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let s3Client = null;

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  logger.info('Storage', 'AWS S3 Client initialized successfully');
} else {
  logger.info('Storage', 'Using Local Disk Storage mode for uploaded documents');
}

const getBaseServerUrl = () => {
  return env.SERVER_URL || `http://localhost:${env.PORT || 5000}`;
};

export const uploadToS3 = async (fileBuffer, s3Key, mimeType) => {
  if (!s3Client) {
    const fileName = path.basename(s3Key);
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    return `${getBaseServerUrl()}/uploads/${fileName}`;
  }

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${s3Key}`;
};

export const getS3PresignedUrl = async (s3Key, expiresIn = 3600) => {
  if (!s3Client) {
    const fileName = path.basename(s3Key);
    return `${getBaseServerUrl()}/uploads/${fileName}`;
  }

  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: s3Key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteFromS3 = async (s3Key) => {
  if (!s3Client) {
    const fileName = path.basename(s3Key);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  }

  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: s3Key,
  });

  await s3Client.send(command);
  return true;
};

export default {
  uploadToS3,
  getS3PresignedUrl,
  deleteFromS3,
};

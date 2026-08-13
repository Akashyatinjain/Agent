/**
 * Shared In-Memory RAG Document Cache
 * Ensures document chunks are immediately searchable even when database vector indexes are initializing or running offline.
 */
const documentStore = [];
const fileStore = [];

export const saveInMemoryDocument = (doc) => {
  documentStore.push(doc);
};

export const getInMemoryDocuments = (userId) => {
  return documentStore.filter((d) => !userId || d.userId === userId);
};

export const saveInMemoryFile = (file) => {
  const existingIdx = fileStore.findIndex((f) => f.id === file.id);
  if (existingIdx >= 0) {
    fileStore[existingIdx] = { ...fileStore[existingIdx], ...file };
  } else {
    fileStore.push(file);
  }
};

export const getInMemoryFiles = (userId) => {
  return fileStore.filter((f) => !userId || f.userId === userId);
};

export const deleteInMemoryFile = (fileId, userId) => {
  const fIdx = fileStore.findIndex((f) => f.id === fileId && (!userId || f.userId === userId));
  if (fIdx >= 0) fileStore.splice(fIdx, 1);
  for (let i = documentStore.length - 1; i >= 0; i--) {
    if (documentStore[i].fileId === fileId) {
      documentStore.splice(i, 1);
    }
  }
};

export default {
  saveInMemoryDocument,
  getInMemoryDocuments,
  saveInMemoryFile,
  getInMemoryFiles,
  deleteInMemoryFile
};

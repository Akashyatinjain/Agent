/**
 * Shared In-Memory RAG Document Store with Exact Cosine Similarity Search
 */

const documentStore = [];
const fileStore = [];

export const saveInMemoryDocument = (doc) => {
  const existingIdx = documentStore.findIndex((d) => d.id === doc.id);
  if (existingIdx >= 0) {
    documentStore[existingIdx] = { ...documentStore[existingIdx], ...doc };
  } else {
    documentStore.push(doc);
  }
};

export const getInMemoryDocuments = (userId, fileId = null) => {
  return documentStore.filter(
    (d) => (!userId || d.userId === userId) && (!fileId || d.fileId === fileId)
  );
};

export const searchInMemoryDocuments = (queryVector, userId, topK = 5, minSimilarity = 0.15, fileId = null) => {
  const userDocs = documentStore.filter(
    (d) => (!userId || d.userId === userId) && (!fileId || d.fileId === fileId)
  );
  if (userDocs.length === 0 || !queryVector || queryVector.length === 0) {
    return [];
  }

  const scoredDocs = [];

  for (const doc of userDocs) {
    if (!doc.embedding || doc.embedding.length === 0) continue;

    // Compute Dot product of unit vectors
    let dot = 0;
    const len = Math.min(queryVector.length, doc.embedding.length);
    for (let i = 0; i < len; i++) {
      dot += queryVector[i] * doc.embedding[i];
    }

    const similarity = Math.max(0, Math.min(1, dot));

    if (similarity >= minSimilarity) {
      scoredDocs.push({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        fileId: doc.fileId,
        similarity: parseFloat(similarity.toFixed(4))
      });
    }
  }

  return scoredDocs
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
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
    if (documentStore[i].fileId === fileId && (!userId || documentStore[i].userId === userId)) {
      documentStore.splice(i, 1);
    }
  }
};

export default {
  saveInMemoryDocument,
  getInMemoryDocuments,
  searchInMemoryDocuments,
  saveInMemoryFile,
  getInMemoryFiles,
  deleteInMemoryFile
};

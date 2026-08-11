import React, { useEffect, useState } from 'react';
import FileUpload from '../features/files/FileUpload';
import FileList from '../features/files/FileList';
import { fetchFilesApi } from '../api/files';

export const FilesPage = () => {
  const [files, setFiles] = useState([]);

  const loadFiles = async () => {
    try {
      const res = await fetchFilesApi();
      if (res.success) setFiles(res.files);
    } catch (e) {}
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">AWS S3 File Storage & RAG Engine</h1>
        <p className="text-xs text-gray-400">Upload documents to index into Neon pgvector embeddings for instant AI retrieval.</p>
      </div>

      <FileUpload onUploadSuccess={loadFiles} />
      <FileList files={files} onDeleteSuccess={loadFiles} />
    </div>
  );
};

export default FilesPage;

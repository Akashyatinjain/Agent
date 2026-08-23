import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFileApi } from '../../api/files';

export const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processUpload = async (file) => {
    if (!file) return;

    // Check size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'File exceeds 10MB limit. Please upload a smaller document.' });
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const res = await uploadFileApi(file);
      if (res.success && res.file) {
        setStatus({
          type: 'success',
          message: `File "${file.name}" uploaded successfully! Generating vector embeddings...`
        });
        if (onUploadSuccess) onUploadSuccess(res.file);
      } else {
        setStatus({
          type: 'error',
          message: res.error?.message || res.error || 'Upload failed'
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error?.message || err.response?.data?.error || err.message || 'File upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUpload(file);
  };

  return (
    <div
      className="p-4 sm:p-6 rounded-2xl space-y-4 animate-fade-in"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
        <UploadCloud className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
        <span>Upload Document for pgvector RAG Indexing</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all relative cursor-pointer group"
        style={{
          borderColor: isDragOver ? 'var(--text-primary)' : 'var(--border-primary)',
          backgroundColor: isDragOver ? 'var(--bg-hover)' : 'transparent'
        }}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md,.docx,.csv,.json"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center gap-2.5 pointer-events-none">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)'
            }}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <FileText className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Ingesting document & generating embeddings...' : 'Click or drop documents to index'}
          </p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Supports PDF, Markdown (.md), Plain Text (.txt), Word (.docx), CSV & JSON (Up to 10MB)
          </span>
        </div>
      </div>

      {status && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium animate-fade-in"
          style={{
            backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: status.type === 'success' ? '#10b981' : '#ef4444'
          }}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="break-words">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

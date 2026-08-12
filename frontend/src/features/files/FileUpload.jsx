import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFileApi } from '../../api/files';

export const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);

    try {
      const res = await uploadFileApi(file);
      if (res.success) {
        setStatus({ type: 'success', message: `File "${file.name}" uploaded to AWS S3 & processing RAG vectors!` });
        if (onUploadSuccess) onUploadSuccess(res.file);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
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
        <span>Upload Document to AWS S3 + pgvector RAG Index</span>
      </div>

      <div
        className="border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors relative cursor-pointer group"
        style={{ borderColor: 'var(--border-primary)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md,.docx,.csv,.json"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          <FileText className="w-10 h-10 transition-colors" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading to S3...' : (
              <>
                <span className="hidden sm:inline">Click or drag & drop documents here</span>
                <span className="sm:hidden">Tap to select documents</span>
              </>
            )}
          </p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Supports PDF, TXT, MD, DOCX, CSV, JSON (Up to 10MB)</span>
        </div>
      </div>

      {status && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            color: status.type === 'success' ? 'var(--text-secondary)' : '#ef4444'
          }}
        >
          {status.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="break-words">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

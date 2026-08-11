import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFileApi } from '../../api/files';
import Button from '../../components/ui/Button';

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
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-gray-800 space-y-4">
      <div className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
        <UploadCloud className="w-5 h-5 text-gray-300" />
        <span>Upload Document to AWS S3 + pgvector RAG Index</span>
      </div>

      <div className="border-2 border-dashed border-gray-700 hover:border-white/20 rounded-xl p-6 sm:p-8 text-center transition-colors relative cursor-pointer group">
        <input
          type="file"
          accept=".pdf,.txt,.md,.docx,.csv,.json"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          <FileText className="w-10 h-10 text-gray-400 group-hover:text-gray-200 transition-colors" />
          <p className="text-sm font-medium text-gray-200">
            {uploading ? 'Uploading to S3...' : (
              <>
                <span className="hidden sm:inline">Click or drag & drop documents here</span>
                <span className="sm:hidden">Tap to select documents</span>
              </>
            )}
          </p>
          <span className="text-xs text-gray-500">Supports PDF, TXT, MD, DOCX, CSV, JSON (Up to 10MB)</span>
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
          status.type === 'success' ? 'bg-white/5 text-gray-200 border border-white/10' : 'bg-white/5 text-gray-200 border border-white/10'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-gray-300" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 text-gray-300" />}
          <span className="break-words">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

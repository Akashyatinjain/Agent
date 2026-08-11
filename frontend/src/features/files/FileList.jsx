import React from 'react';
import { FileText, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { deleteFileApi } from '../../api/files';

export const FileList = ({ files = [], onDeleteSuccess }) => {
  const handleDelete = async (id) => {
    try {
      await deleteFileApi(id);
      if (onDeleteSuccess) onDeleteSuccess(id);
    } catch (e) {
      alert('Failed to delete file');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-gray-200 font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" /> Indexed
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-gray-300 font-medium text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-300" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-300 font-medium text-[11px] animate-pulse">
            <Clock className="w-3.5 h-3.5 text-gray-300" /> Processing
          </span>
        );
    }
  };

  if (files.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-gray-800 text-gray-500 text-sm">
        No files uploaded yet. Upload PDFs or notes to enable vector RAG queries!
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
      <h3 className="text-sm font-semibold text-gray-200">Uploaded RAG Knowledge Files ({files.length})</h3>
      <div className="divide-y divide-gray-800">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-200 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {file.chunkCount || 0} chunks</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {getStatusBadge(file.status)}
              <button
                onClick={() => handleDelete(file.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;

import React from 'react';
import { FileText, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { deleteFileApi } from '../../api/files';

export const FileList = ({ files = [], onDeleteSuccess }) => {
  const handleDelete = async (id) => {
    try {
      await deleteFileApi(id);
      if (onDeleteSuccess) onDeleteSuccess(id);
    } catch (e) {
      alert('Failed to delete file from storage.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 font-semibold text-xs text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" /> Indexed into RAG
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 font-semibold text-xs text-red-500">
            <AlertTriangle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 font-semibold text-xs text-amber-500 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Embedding
          </span>
        );
    }
  };

  if (files.length === 0) {
    return (
      <div
        className="p-8 text-center rounded-2xl text-xs sm:text-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-muted)'
        }}
      >
        No files indexed yet. Upload PDFs, notes, or spreadsheets above to enable vector RAG queries!
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 rounded-2xl space-y-4 animate-fade-in"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Indexed Knowledge Documents ({files.length})
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between py-3 gap-3 overflow-hidden"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB • {file.chunkCount || 0} vector chunks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {getStatusBadge(file.status)}
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Delete document"
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

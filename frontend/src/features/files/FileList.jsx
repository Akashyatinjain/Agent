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
          <span className="flex items-center gap-1 font-medium text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> Indexed
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 font-medium text-[11px]" style={{ color: '#ef4444' }}>
            <AlertTriangle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 font-medium text-[11px] animate-pulse" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
    }
  };

  if (files.length === 0) {
    return (
      <div
        className="p-8 text-center rounded-2xl text-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-muted)'
        }}
      >
        No files uploaded yet. Upload PDFs or notes to enable vector RAG queries!
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
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        Uploaded RAG Knowledge Files ({files.length})
      </h3>
      <div style={{ borderColor: 'var(--border-secondary)' }}>
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between py-3 gap-3 overflow-hidden"
            style={{ borderBottom: '1px solid var(--border-secondary)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB • {file.chunkCount || 0} chunks</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {getStatusBadge(file.status)}
              <button
                onClick={() => handleDelete(file.id)}
                className="p-2.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
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

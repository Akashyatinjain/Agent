import React, { useState, useRef } from 'react';
import { Send, Sparkles, Paperclip, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import ModelSelector from './ModelSelector';
import useChatStore from '../../store/chatStore';
import { uploadFileApi } from '../../api/files';

export const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { activeRouterIntent } = useChatStore();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const res = await uploadFileApi(file);
      if (res.success && res.file) {
        setAttachedFile({
          id: res.file.id,
          name: res.file.name
        });
        if (!input.trim()) {
          setInput(`Summarize and extract key insights from ${res.file.name}`);
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
    setAttachedFile(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getRouterBadge = () => {
    if (!activeRouterIntent) return null;
    const pulse = activeRouterIntent.routerType ? 'animate-pulse' : '';
    const label = {
      rag: 'AI Router: Querying pgvector RAG Index',
      tool: 'AI Router: Executing Real-time Tool API',
      hybrid: 'AI Router: Synthesizing RAG + Live Tools',
    }[activeRouterIntent.routerType] || 'AI Router: Direct Knowledge Synthesis';

    return (
      <div className="flex justify-center pb-1">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium animate-scale-in ${pulse}`}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span className="truncate">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-2">
      {getRouterBadge()}

      <div
        className="relative rounded-2xl p-2 transition-all duration-200 theme-transition"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border-primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {attachedFile && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium w-fit mb-2 animate-fade-in"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate max-w-[200px]">{attachedFile.name}</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Indexed into RAG
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-0.5 rounded hover:text-red-400 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MiniGPT anything, search web, query documents, or solve daily problems..."
          disabled={disabled || isUploadingFile}
          className="w-full bg-transparent text-sm p-2.5 focus:outline-none resize-none"
          style={{
            color: 'var(--text-primary)',
            caretColor: 'var(--text-primary)'
          }}
        />

        <div
          className="flex items-center justify-between pt-2 px-2"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            <ModelSelector />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.md,.docx,.csv,.json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploadingFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105 shrink-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)'
              }}
              title="Upload PDF/TXT/MD file for RAG Vector Indexing"
            >
              {isUploadingFile ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Paperclip className="w-3.5 h-3.5" />
              )}
              <span>{isUploadingFile ? 'Indexing File...' : 'Add RAG File'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || disabled || isUploadingFile}
            className="p-3 rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-40"
            style={{
              backgroundColor: !input.trim() || disabled || isUploadingFile ? 'var(--bg-hover)' : 'var(--bg-accent)',
              color: !input.trim() || disabled || isUploadingFile ? 'var(--text-muted)' : 'var(--text-on-accent)',
              boxShadow: !input.trim() || disabled || isUploadingFile ? 'none' : 'var(--shadow-sm)'
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
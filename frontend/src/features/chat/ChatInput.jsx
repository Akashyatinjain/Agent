import React, { useState, useRef } from 'react';
import {
  Send, Sparkles, Paperclip, FileText, X,
  Loader2, CheckCircle2, Square
} from 'lucide-react';
import AgentSelector from './AgentSelector';
import useChatStore from '../../store/chatStore';
import { uploadFileApi } from '../../api/files';

export const ChatInput = ({ onSend, onStop, disabled, isGenerating, activeDocument = null }) => {
  const [input, setInput] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState(activeDocument);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { activeRouterIntent } = useChatStore();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const res = await uploadFileApi(file);
      if (res.success && res.file) {
        const fileObj = {
          id: res.file.id,
          name: res.file.name,
          size: res.file.size,
          chunkCount: res.file.chunkCount
        };
        setAttachedFile(fileObj);
        if (!input.trim()) {
          setInput(`Review and summarize key details from ${res.file.name}`);
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 44), 180)}px`;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGenerating && onStop) {
      onStop();
      return;
    }
    if (!input.trim() || disabled) return;
    onSend(input.trim(), attachedFile);
    setInput('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Human-friendly, non-technical thinking status
  const getThinkingLabel = () => {
    if (!activeRouterIntent) return null;
    const type = activeRouterIntent.routerType;
    if (type === 'rag') return 'Searching your documents...';
    if (type === 'tool') return 'Running analysis & tools...';
    if (type === 'hybrid') return 'Reading sources and searching web...';
    return 'Thinking & generating response...';
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-2 relative">
      {/* Subtle, non-technical processing status */}
      {isGenerating && activeRouterIntent && (
        <div className="flex justify-center pb-1">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium animate-fade-in"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin text-blue-500" />
            <span className="truncate">{getThinkingLabel()}</span>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl p-2 transition-all duration-200 theme-transition relative"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
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
            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate max-w-[220px] font-semibold">{attachedFile.name}</span>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-0.5 rounded hover:text-red-500 transition-colors ml-1 cursor-pointer"
              title="Remove document attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            attachedFile
              ? `Ask anything about "${attachedFile.name}"...`
              : "Ask anything, search web, query your documents, or review your resume..."
          }
          disabled={disabled || isUploadingFile}
          className="w-full bg-transparent text-sm p-2.5 focus:outline-none resize-none leading-relaxed transition-all"
          style={{
            color: 'var(--text-primary)',
            caretColor: 'var(--text-primary)',
            minHeight: '44px',
            maxHeight: '180px'
          }}
        />

        <div
          className="flex items-center justify-between pt-2 px-2 gap-2 relative z-20"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          <div className="flex items-center gap-2 min-w-0 py-0.5 relative z-30">
            <AgentSelector />

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
              disabled={disabled || isUploadingFile || isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)'
              }}
              title="Attach document to conversation"
            >
              {isUploadingFile ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : (
                <Paperclip className="w-3.5 h-3.5" />
              )}
              <span>{isUploadingFile ? 'Reading...' : 'Attach'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={(!input.trim() && !isGenerating) || disabled || isUploadingFile}
            className="p-2.5 sm:p-3 rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-40 cursor-pointer"
            style={{
              backgroundColor: isGenerating 
                ? '#ef4444' 
                : (!input.trim() || disabled || isUploadingFile ? 'var(--bg-hover)' : 'var(--bg-accent)'),
              color: isGenerating 
                ? '#ffffff' 
                : (!input.trim() || disabled || isUploadingFile ? 'var(--text-muted)' : 'var(--text-on-accent)'),
              boxShadow: !input.trim() || disabled || isUploadingFile ? 'none' : 'var(--shadow-sm)'
            }}
            title={isGenerating ? 'Stop generation' : 'Send message'}
          >
            {isGenerating ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
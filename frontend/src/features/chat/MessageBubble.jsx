import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, User, Copy, Check, RotateCcw, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import ToolCallDisplay from './ToolCallDisplay';
import RagContextDisplay from './RagContextDisplay';
import useUIStore from '../../store/uiStore';

const CodeBlock = ({ language, code, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-primary)' }}>
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[11px] font-mono select-none"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
      >
        <span>{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '12px 16px',
          fontSize: '12px',
          backgroundColor: isDark ? '#141417' : '#f8f9fa',
          borderRadius: 0
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export const MessageBubble = ({ message, isStreaming = false, onRegenerate = null }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useUIStore();
  const isUser = message.role === 'user';
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract attached document if present in user message
  let attachedDocument = message.attachedFile || null;
  if (!attachedDocument && message.ragContext) {
    try {
      const parsed = typeof message.ragContext === 'string' ? JSON.parse(message.ragContext) : message.ragContext;
      if (parsed?.attachedFile) {
        attachedDocument = parsed.attachedFile;
      }
    } catch (e) {}
  }

  const getRouterBadge = (type) => {
    const label = {
      rag: 'RAG Vector Index',
      tool: 'Tool Execution',
      hybrid: 'Hybrid RAG + Tools',
      chat: 'Direct LLM'
    }[type] || 'Direct LLM';

    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-tertiary)',
          border: '1px solid var(--border-secondary)'
        }}
      >
        {label}
      </span>
    );
  };

  const bubbleStyle = isUser
    ? {
        backgroundColor: 'var(--bg-accent)',
        color: 'var(--text-on-accent)',
        boxShadow: 'var(--shadow-sm)'
      }
    : {
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      };

  return (
    <div
      className="flex gap-2.5 sm:gap-3.5 p-3.5 sm:p-4 rounded-2xl max-w-[95%] sm:max-w-2xl md:max-w-3xl transition-all duration-200"
      style={{
        marginLeft: isUser ? 'auto' : undefined,
        marginRight: isUser ? undefined : 'auto',
        ...bubbleStyle
      }}
    >
      <div
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isUser
            ? (isDark ? '#27272d' : '#27272a')
            : 'var(--bg-secondary)',
          color: isUser ? '#ffffff' : 'var(--text-primary)',
          border: '1px solid var(--border-primary)'
        }}
      >
        {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold"
              style={{
                color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'
              }}
            >
              {isUser ? 'You' : 'MiniGPT'}
            </span>
            {!isUser && message.routerType && getRouterBadge(message.routerType)}
            {!isUser && isStreaming && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 animate-pulse font-medium">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded-lg transition-colors cursor-pointer"
              style={{
                color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)'
              }}
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Attached Document Card in User Message */}
        {isUser && attachedDocument && (
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium my-1.5"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <FileText className="w-4 h-4 text-blue-300 shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold truncate text-white">{attachedDocument.name}</span>
              {attachedDocument.size && (
                <span className="text-[10px] text-white/70">
                  {(attachedDocument.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Attached
            </span>
          </div>
        )}

        {!isUser && <RagContextDisplay ragContext={message.ragContext} />}
        {!isUser && <ToolCallDisplay toolCalls={message.toolCalls} />}

        <div
          className="prose max-w-none text-sm leading-relaxed"
          style={{ color: isUser ? '#ffffff' : 'var(--text-primary)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isCodeBlock = match || String(children).includes('\n');
                
                if (isCodeBlock) {
                  return (
                    <CodeBlock
                      language={match ? match[1] : ''}
                      code={String(children).replace(/\n$/, '')}
                      isDark={isDark}
                    />
                  );
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded font-mono text-xs"
                    style={{
                      backgroundColor: isUser
                        ? 'rgba(255,255,255,0.18)'
                        : 'var(--bg-code)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)'
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0" style={{ color: 'inherit' }}>{children}</p>;
              },
              strong({ children }) {
                return <strong style={{ color: 'inherit', fontWeight: 'bold' }}>{children}</strong>;
              },
              li({ children }) {
                return <li className="my-0.5" style={{ color: 'inherit' }}>{children}</li>;
              }
            }}
          >
            {message.content || (isStreaming ? 'Thinking...' : '')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
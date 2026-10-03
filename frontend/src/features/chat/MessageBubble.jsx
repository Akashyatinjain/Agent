import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Sparkles, User, Copy, Check, RotateCcw, Loader2, FileText,
  CheckCircle2, AlertTriangle, RefreshCw, ThumbsUp, ThumbsDown
} from 'lucide-react';
import ToolCallDisplay from './ToolCallDisplay';
import RagContextDisplay from './RagContextDisplay';
import useUIStore from '../../store/uiStore';

// Pre-sanitized Prism styles to remove textShadow and background artifacts in both themes
const sanitizeTheme = (theme) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(theme)) {
    if (typeof value === 'object' && value !== null) {
      const copy = { ...value };
      delete copy.textShadow;
      if (copy.background && copy.background !== 'inherit') {
        if (!key.includes('inserted') && !key.includes('deleted')) {
          delete copy.background;
          delete copy.backgroundColor;
        }
      }
      sanitized[key] = copy;
    } else {
      sanitized[key] = value;
    }
  }

  if (sanitized['pre[class*="language-"]']) {
    sanitized['pre[class*="language-"]'] = {
      ...sanitized['pre[class*="language-"]'],
      background: 'transparent',
      backgroundColor: 'transparent',
      textShadow: 'none',
      border: 'none',
      boxShadow: 'none',
      margin: 0,
      padding: 0
    };
  }
  if (sanitized['code[class*="language-"]']) {
    sanitized['code[class*="language-"]'] = {
      ...sanitized['code[class*="language-"]'],
      background: 'transparent',
      backgroundColor: 'transparent',
      textShadow: 'none'
    };
  }
  return sanitized;
};

const sanitizedDarkTheme = sanitizeTheme(oneDark);
const sanitizedLightTheme = sanitizeTheme(oneLight);

const CodeBlock = React.memo(({ language, code, isDark, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWheel = (e) => {
    // If vertical scroll (deltaY != 0) is predominant and user is not holding Shift (horizontal scroll),
    // forward the vertical scroll to the nearest scrollable chat container (.overflow-y-auto)
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
      const scrollParent = e.currentTarget.closest('.overflow-y-auto');
      if (scrollParent) {
        scrollParent.scrollTop += e.deltaY;
      }
    }
  };

  const normalizedLang = (language || 'code').toLowerCase();

  return (
    <div
      className="code-block-wrapper relative group my-2.5 sm:my-3.5 rounded-xl overflow-hidden w-full max-w-full theme-transition"
      onWheel={handleWheel}
      style={{
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        backgroundColor: isDark ? '#0d0e12' : '#f8fafc',
        boxShadow: isDark
          ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px -2px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Code Header Bar */}
      <div
        className="flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-mono select-none"
        style={{
          backgroundColor: isDark ? '#15161c' : '#f1f5f9',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0'
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
            style={{
              backgroundColor: isDark ? '#38bdf8' : '#0284c7'
            }}
          />
          <span
            className="font-semibold tracking-wider uppercase text-[10px] sm:text-[11px]"
            style={{
              color: isDark ? '#cbd5e1' : '#475569'
            }}
          >
            {normalizedLang}
          </span>
          {isStreaming && (
            <span className="text-[10px] text-amber-500 animate-pulse ml-1 font-mono">
              typing...
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all duration-150 cursor-pointer"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            color: copied ? (isDark ? '#34d399' : '#059669') : (isDark ? '#e2e8f0' : '#475569')
          }}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content Area */}
      <div
        className="overflow-x-auto overflow-y-hidden w-full max-w-full"
        style={{
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'auto',
          touchAction: 'pan-y pan-x',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {isStreaming ? (
          // Fast-path raw renderer while streaming: avoids heavy synchronous Prism parsing on every token!
          <pre
            className="m-0 p-2.5 sm:p-4 text-[11.5px] sm:text-[13px] font-mono leading-relaxed"
            style={{
              background: 'transparent',
              backgroundColor: 'transparent',
              color: isDark ? '#e2e8f0' : '#1e293b',
              whiteSpace: 'pre',
              wordBreak: 'normal',
              overflowWrap: 'normal',
              overflowX: 'auto',
              overflowY: 'hidden',
              overscrollBehaviorX: 'contain',
              overscrollBehaviorY: 'auto',
              touchAction: 'pan-y pan-x',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <code className="block min-w-full font-mono">{code}</code>
          </pre>
        ) : (
          <SyntaxHighlighter
            style={isDark ? sanitizedDarkTheme : sanitizedLightTheme}
            language={normalizedLang === 'code' ? 'text' : normalizedLang}
            PreTag="div"
            codeTagProps={{
              style: {
                background: 'transparent',
                backgroundColor: 'transparent',
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                display: 'block',
                minWidth: '100%',
                lineHeight: '1.6'
              }
            }}
            customStyle={{
              margin: 0,
              padding: '10px 14px',
              fontSize: '12px',
              lineHeight: '1.6',
              background: 'transparent',
              backgroundColor: 'transparent',
              borderRadius: 0,
              maxWidth: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              overscrollBehaviorX: 'contain',
              overscrollBehaviorY: 'auto',
              touchAction: 'pan-y pan-x',
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace"
            }}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
});

export const MessageBubble = ({ message, isStreaming = false, onRegenerate = null, onRetry = null }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const { theme } = useUIStore();
  const isUser = (message.role || '').toLowerCase() === 'user';
  const isDark = theme === 'dark';

  const isError = !isUser && (
    message.content?.startsWith('❌') ||
    message.content?.startsWith('⚠️') ||
    message.isError
  );

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
    } catch (e) { }
  }

  const getRouterBadge = (type) => {
    const label = {
      rag: 'Document RAG',
      tool: 'Live Tool',
      hybrid: 'RAG + Tool',
      chat: 'Direct LLM'
    }[type] || 'Direct LLM';

    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-secondary)'
        }}
      >
        {label}
      </span>
    );
  };

  const bubbleStyle = isUser
    ? {
      backgroundColor: isDark ? '#27272a' : '#f4f4f5',
      color: isDark ? '#fafafa' : '#09090b',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-sm)'
    }
    : isError
      ? {
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        color: 'var(--text-primary)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: 'var(--shadow-sm)'
      }
      : {
        backgroundColor: isDark ? '#121215' : '#ffffff',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      };

  return (
    <div
      className="group flex gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-2xl w-full max-w-full sm:max-w-2xl md:max-w-3xl transition-all duration-200"
      style={{
        marginLeft: isUser ? 'auto' : undefined,
        marginRight: isUser ? undefined : 'auto',
        ...bubbleStyle
      }}
    >
      <div
        className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0"
        style={{
          backgroundColor: isUser
            ? (isDark ? '#3f3f46' : '#e4e4e7')
            : isError
              ? 'rgba(239, 68, 68, 0.15)'
              : 'var(--bg-secondary)',
          color: isUser ? (isDark ? '#ffffff' : '#09090b') : isError ? '#ef4444' : 'var(--text-primary)',
          border: '1px solid var(--border-primary)'
        }}
      >
        {isUser ? (
          <User className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : isError ? (
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
        ) : (
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold"
              style={{
                color: isUser ? (isDark ? '#e4e4e7' : '#27272a') : 'var(--text-primary)'
              }}
            >
              {isUser ? 'You' : 'Agent'}
            </span>
            {!isUser && message.routerType && getRouterBadge(message.routerType)}
            {!isUser && isStreaming && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 animate-pulse font-medium">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-lg transition-colors cursor-pointer"
              style={{
                color: 'var(--text-muted)'
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
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {attachedDocument.name}
              </span>
              {attachedDocument.size && (
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {(attachedDocument.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Attached
            </span>
          </div>
        )}

        {!isUser && <RagContextDisplay ragContext={message.ragContext} />}
        {!isUser && <ToolCallDisplay toolCalls={message.toolCalls} />}

        <div
          className="prose max-w-none text-xs sm:text-sm leading-relaxed overflow-hidden space-y-2"
          style={{ color: isUser ? (isDark ? '#fafafa' : '#09090b') : 'var(--text-primary)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1({ children }) {
                return <h1 className="text-base sm:text-lg font-bold mt-4 mb-2 pb-1 border-b border-[var(--border-secondary)]">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-sm sm:text-base font-bold mt-3.5 mb-1.5 text-emerald-500">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-xs sm:text-sm font-bold mt-3 mb-1.5 flex items-center gap-1.5">{children}</h3>;
              },
              h4({ children }) {
                return <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-2.5 mb-1 text-[var(--text-secondary)]">{children}</h4>;
              },
              hr() {
                return <hr className="my-3 border-[var(--border-secondary)] opacity-60" />;
              },
              ul({ children }) {
                return <ul className="list-disc list-inside space-y-1.5 my-2 pl-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside space-y-1.5 my-2 pl-1 font-medium">{children}</ol>;
              },
              li({ children }) {
                return <li className="leading-relaxed break-words" style={{ color: 'inherit' }}>{children}</li>;
              },
              table({ children }) {
                return (
                  <div className="my-3 overflow-x-auto rounded-xl border border-[var(--border-primary)] shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">{children}</table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] font-bold">{children}</thead>;
              },
              th({ children }) {
                return <th className="px-3.5 py-2.5 font-bold text-[var(--text-primary)]">{children}</th>;
              },
              td({ children }) {
                return <td className="px-3.5 py-2 border-t border-[var(--border-secondary)] text-[var(--text-secondary)]">{children}</td>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 border-emerald-500 pl-3.5 my-2.5 italic text-[var(--text-secondary)] bg-[var(--bg-secondary)] py-1.5 rounded-r-lg">
                    {children}
                  </blockquote>
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isCodeBlock = match || String(children).includes('\n');

                if (isCodeBlock) {
                  return (
                    <CodeBlock
                      language={match ? match[1] : ''}
                      code={String(children).replace(/\n$/, '')}
                      isDark={isDark}
                      isStreaming={isStreaming}
                    />
                  );
                }

                return (
                  <code
                    className="inline-code px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] sm:text-[12px] font-medium"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                      color: isDark ? '#f1f5f9' : '#0f172a'
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0 leading-relaxed break-words" style={{ color: 'inherit' }}>{children}</p>;
              },
              strong({ children }) {
                return <strong style={{ color: 'inherit', fontWeight: 'bold' }}>{children}</strong>;
              }
            }}
          >
            {message.content || (isStreaming ? 'Thinking...' : '')}
          </ReactMarkdown>
        </div>

        {/* Subtle Bottom Action Bar on Assistant Messages */}
        {!isUser && !isStreaming && (
          <div
            className="flex items-center gap-2 pt-2 mt-1 border-t border-[var(--border-secondary)] text-[11px] opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              title="Copy answer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                title="Regenerate answer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-amber-500/10 text-amber-500 transition-colors cursor-pointer"
                title="Retry request"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={`p-1 rounded transition-colors cursor-pointer ${feedback === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-[var(--bg-secondary)]'}`}
                title="Helpful"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={`p-1 rounded transition-colors cursor-pointer ${feedback === 'down' ? 'text-red-400 bg-red-500/10' : 'hover:bg-[var(--bg-secondary)]'}`}
                title="Not helpful"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
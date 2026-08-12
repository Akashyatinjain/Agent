import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import ToolCallDisplay from './ToolCallDisplay';
import RagContextDisplay from './RagContextDisplay';
import useUIStore from '../../store/uiStore';

export const MessageBubble = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const { theme } = useUIStore();
  const isUser = message.role === 'user';
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRouterBadge = (type) => {
    const label = {
      rag: 'RAG Vector',
      tool: 'Tool Execution',
      hybrid: 'Hybrid RAG + Tool',
      default: 'Direct LLM'
    }[type] || 'Direct LLM';

    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-tertiary)',
          border: '1px solid var(--border-primary)'
        }}
      >
        {label}
      </span>
    );
  };

  const bubbleStyle = isUser
    ? {
        backgroundColor: isDark ? '#27272a' : '#18181b',
        color: '#ffffff',
        border: isDark ? '1px solid #3f3f46' : '1px solid #18181b',
      }
    : {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
      };

  return (
    <div
      className="flex gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl max-w-[92%] sm:max-w-2xl md:max-w-3xl transition-all duration-200"
      style={{
        marginLeft: isUser ? 'auto' : undefined,
        marginRight: isUser ? undefined : 'auto',
        ...bubbleStyle
      }}
    >
      <div
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isUser
            ? (isDark ? '#3f3f46' : '#27272a')
            : 'var(--bg-tertiary)',
          color: isUser ? '#ffffff' : 'var(--text-primary)'
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
                color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)'
              }}
            >
              {isUser ? 'You' : 'MiniGPT'}
            </span>
            {!isUser && message.routerType && getRouterBadge(message.routerType)}
          </div>
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg transition-colors"
            style={{
              color: isUser ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'
            }}
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isUser && <RagContextDisplay ragContext={message.ragContext} />}
        {!isUser && <ToolCallDisplay toolCalls={message.toolCalls} />}

        <div
          className="prose max-w-none text-sm leading-relaxed"
          style={{ color: isUser ? '#ffffff' : 'var(--text-primary)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-xl my-2 text-xs"
                    customStyle={{
                      backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '12px'
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="px-1.5 py-0.5 rounded font-mono text-xs"
                    style={{
                      backgroundColor: isUser
                        ? 'rgba(255,255,255,0.15)'
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
                return <strong style={{ color: 'inherit' }}>{children}</strong>;
              },
              li({ children }) {
                return <li style={{ color: 'inherit' }}>{children}</li>;
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
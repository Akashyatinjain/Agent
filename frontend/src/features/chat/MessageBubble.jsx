import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import ToolCallDisplay from './ToolCallDisplay';
import RagContextDisplay from './RagContextDisplay';

export const MessageBubble = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

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
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-200 border border-white/10">
        {label}
      </span>
    );
  };

  return (
    <div className={`flex gap-3.5 p-4 rounded-2xl max-w-3xl transition-all ${
      isUser
        ? 'ml-auto bg-slate-900/90 border border-white/10 text-gray-100'
        : 'mr-auto glass-panel border border-white/10 text-gray-100'
    }`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-slate-700 text-white'
          : 'bg-slate-800 text-white shadow-md shadow-slate-900/20'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">{isUser ? 'You' : 'MiniGPT'}</span>
            {!isUser && message.routerType && getRouterBadge(message.routerType)}
          </div>
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-gray-200" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isUser && <RagContextDisplay ragContext={message.ragContext} />}
        {!isUser && <ToolCallDisplay toolCalls={message.toolCalls} />}

        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-xl border border-gray-800 my-2 text-xs !bg-gray-950"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-200 font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
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

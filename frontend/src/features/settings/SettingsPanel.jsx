import React, { useState, useEffect } from 'react';
import {
  Settings, Key, Database, Cloud, Sparkles, Cpu, Zap,
  Smartphone, Send, MessageSquare, Check, Copy, ExternalLink,
  RefreshCw, Unlink, Mic, Brain, FileText, X
} from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { getConnectedChannels, startChannelLink, disconnectChannel } from '../../api/integrations';

export const SettingsPanel = () => {
  const [channelsData, setChannelsData] = useState({
    channels: [],
    telegram: { isConfigured: false, botUsername: 'AkashAgentBot', botUrl: 'https://t.me/AkashAgentBot' },
    whatsapp: { isConfigured: false, phoneNumber: null }
  });
  const [loading, setLoading] = useState(true);
  const [pairingModal, setPairingModal] = useState(null); // { channelType, code, deepLink, botUsername }
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChannels = async () => {
    try {
      const data = await getConnectedChannels();
      if (data.success) {
        setChannelsData(data);
      }
    } catch (err) {
      console.error('Error fetching connected channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // Poll for connection status when modal is open
  useEffect(() => {
    if (!pairingModal) return;
    const interval = setInterval(async () => {
      try {
        const data = await getConnectedChannels();
        if (data.success) {
          const matched = data.channels.find(
            ch => ch.channelType === pairingModal.channelType && ch.isVerified
          );
          if (matched) {
            setChannelsData(data);
            setPairingModal(null);
          }
        }
      } catch (e) {
        // silent poll
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pairingModal]);

  const handleStartLink = async (channelType) => {
    setActionLoading(true);
    try {
      const data = await startChannelLink(channelType);
      if (data.success) {
        setPairingModal({
          channelType,
          code: data.code,
          deepLink: data.deepLink,
          botUsername: data.botUsername,
          instruction: data.instruction
        });
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to start linking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (channelType) => {
    if (!window.confirm(`Are you sure you want to disconnect ${channelType}?`)) return;
    setActionLoading(true);
    try {
      await disconnectChannel(channelType);
      await fetchChannels();
    } catch (err) {
      alert('Failed to disconnect channel. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const telegramChannel = channelsData.channels.find(c => c.channelType === 'TELEGRAM');
  const whatsappChannel = channelsData.channels.find(c => c.channelType === 'WHATSAPP');

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-tertiary)'
            }}
          >
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Settings & Channels
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Configure AI models, storage engines, and connect smartphone bots with Unified Memory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Theme:</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Omnichannel Assistant Section */}
      <div
        className="p-6 rounded-2xl space-y-5"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Smartphone className="w-4 h-4 text-emerald-500" /> Omnichannel Assistant (Telegram & WhatsApp)
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Talk to your AI agent from your phone via text or voice notes. All your uploaded documents, resumes, and personal memories are synced in real time.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchChannels}
            disabled={actionLoading}
            className="self-start sm:self-auto p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-tertiary)'
            }}
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div
            className="p-2.5 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
          >
            <FileText className="w-4 h-4 shrink-0 text-blue-500" />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              RAG Search over Web Uploads
            </span>
          </div>
          <div
            className="p-2.5 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
          >
            <Brain className="w-4 h-4 shrink-0 text-purple-500" />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Unified Memory Bank Sync
            </span>
          </div>
          <div
            className="p-2.5 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
          >
            <Mic className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              On-the-go Voice Note STT
            </span>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Telegram Card */}
          <div
            className="p-4 rounded-xl flex flex-col justify-between space-y-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)'
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Telegram Bot
                  </h4>
                  <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    @{channelsData.telegram?.botUsername || 'AkashAgentBot'}
                  </p>
                </div>
              </div>

              {telegramChannel?.isVerified ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 shrink-0"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  Connected
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-400 shrink-0"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                >
                  Not Linked
                </span>
              )}
            </div>

            {telegramChannel?.isVerified ? (
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  Linked: {telegramChannel.channelUsername ? `@${telegramChannel.channelUsername}` : `ID ${telegramChannel.channelUserId}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleDisconnect('TELEGRAM')}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleStartLink('TELEGRAM')}
                disabled={actionLoading}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-accent)',
                  color: 'var(--text-on-accent)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Link Telegram Account</span>
              </button>
            )}
          </div>

          {/* WhatsApp Card */}
          <div
            className="p-4 rounded-xl flex flex-col justify-between space-y-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)'
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    WhatsApp Assistant
                  </h4>
                  <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    Twilio & Cloud API Support
                  </p>
                </div>
              </div>

              {whatsappChannel?.isVerified ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 shrink-0"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  Connected
                </span>
              ) : (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-400 shrink-0"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                >
                  Not Linked
                </span>
              )}
            </div>

            {whatsappChannel?.isVerified ? (
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  Phone: {whatsappChannel.channelUserId}
                </span>
                <button
                  type="button"
                  onClick={() => handleDisconnect('WHATSAPP')}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleStartLink('WHATSAPP')}
                disabled={actionLoading}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-accent)',
                  color: 'var(--text-on-accent)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Link WhatsApp Number</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Provider LLMs */}
      <div
        className="p-6 rounded-2xl space-y-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Key className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Multi-Provider LLM Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              { name: 'Google Gemini', model: 'gemini-1.5-flash / 2.0', icon: Sparkles, badge: 'Active' },
              { name: 'Mistral AI', model: 'mistral-small-latest', icon: Zap, badge: 'Active' },
              { name: 'OpenAI Whisper', model: 'whisper-1 / Audio STT', icon: Mic, badge: 'Active' },
            ].map((llm) => (
              <div
                key={llm.name}
                className="p-4 rounded-xl flex items-center justify-between gap-3 min-w-0"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)'
                }}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <llm.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="min-w-0">
                    <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                      {llm.name}
                    </span>
                    <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {llm.model}
                    </p>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 shrink-0"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  {llm.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database & Storage Architecture */}
        <div className="pt-4 space-y-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> Database & Vector Storage
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              className="p-4 rounded-xl flex items-center gap-3 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <Database className="w-7 h-7 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <div className="min-w-0">
                <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                  Neon PostgreSQL + pgvector
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Serverless relational storage and 1536-dimensional vector similarity indexing.
                </p>
              </div>
            </div>

            <div
              className="p-4 rounded-xl flex items-center gap-3 min-w-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <Cloud className="w-7 h-7 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <div className="min-w-0">
                <span className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                  AWS S3 & Local Hybrid Storage
                </span>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Zero-config local file buffer pipeline with optional AWS S3 bucket streaming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pairing Modal */}
      {pairingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-md p-6 rounded-2xl space-y-5 shadow-2xl relative"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  {pairingModal.channelType === 'TELEGRAM' ? <Send className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Link {pairingModal.channelType === 'TELEGRAM' ? 'Telegram Bot' : 'WhatsApp Number'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPairingModal(null)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Use your 6-digit pairing code below to connect your smartphone chat with this web account. Valid for 15 minutes.
            </p>

            {/* Big Code Card */}
            <div
              className="p-4 rounded-xl flex items-center justify-between gap-3 text-center"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)'
              }}
            >
              <div className="flex-1 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-emerald-500">
                {pairingModal.code}
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(pairingModal.code)}
                className="p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              {pairingModal.deepLink && (
                <a
                  href={pairingModal.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{
                    backgroundColor: pairingModal.channelType === 'WHATSAPP' ? '#25D366' : 'var(--bg-accent)',
                    color: '#ffffff',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {pairingModal.channelType === 'WHATSAPP' ? (
                    <MessageSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {pairingModal.channelType === 'WHATSAPP'
                      ? '1-Click Open in WhatsApp'
                      : '1-Click Open in Telegram'}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              )}

              <div
                className="p-3 rounded-xl text-[11px] space-y-1.5"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-muted)'
                }}
              >
                <div className="font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Manual Linking Instructions:
                </div>
                {pairingModal.channelType === 'TELEGRAM' ? (
                  <div>
                    1. Open Telegram and search for <strong className="font-mono text-blue-400">@{pairingModal.botUsername}</strong><br />
                    2. Send command: <strong className="font-mono text-emerald-400">/link {pairingModal.code}</strong>
                  </div>
                ) : (
                  <div>
                    Send <strong className="font-mono text-emerald-400">link {pairingModal.code}</strong> to our WhatsApp bot.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Waiting for connection...</span>
              </div>
              <button
                type="button"
                onClick={() => setPairingModal(null)}
                className="font-semibold hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;

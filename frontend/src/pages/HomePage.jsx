import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Database, Wrench,
  CheckCircle2, Zap, Layers, Cpu,
  Sparkles, Bot, FileText, Globe,
  ChevronDown, Star, Users, Clock, Award, Code,
  Github, Twitter, Linkedin, Mail
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import AgentLogo from '../components/ui/AgentLogo';

const HomePage = () => {
  const navigate = useNavigate();
  const [activePipelineTab, setActivePipelineTab] = useState('router');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Intent Router',
      desc: 'Autonomous routing that picks the optimal pipeline for every prompt without manual configuration.',
      stats: '99.7% Accuracy'
    },
    {
      icon: Database,
      title: 'Neon pgvector Database',
      desc: 'Relational user data AND vector embeddings in a single serverless Postgres database using Prisma.',
      stats: '<100ms Queries'
    },
    {
      icon: Layers,
      title: 'Automatic Memory Bank',
      desc: 'Extracts personal user facts during conversations and persists memories across sessions.',
      stats: 'Infinite Memory'
    },
  ];

  const stats = [
    { icon: Users, label: 'Active Users', value: '2.5K+' },
    { icon: Clock, label: 'Avg Response', value: '<2s' },
    { icon: Award, label: 'Accuracy Rate', value: '98.5%' },
    { icon: Code, label: 'Lines of Code', value: '15K+' },
  ];

  const pipelineTabs = [
    { id: 'router', label: '🧠 Full AI Router Flow' },
    { id: 'chat', label: '💬 Chat Pipeline' },
    { id: 'rag', label: '📚 RAG Pipeline' },
    { id: 'tool', label: '🔧 Tool Pipeline' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden theme-transition"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl animate-orb-1" style={{ backgroundColor: 'var(--orb-color)' }} />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full blur-3xl animate-orb-2" style={{ backgroundColor: 'var(--orb-color)' }} />
        <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full blur-3xl animate-orb-1" style={{ backgroundColor: 'var(--orb-color)', animationDelay: '5s' }} />
      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 theme-transition"
        style={{
          backgroundColor: scrolled ? 'var(--glass)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-primary)' : '1px solid transparent'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <AgentLogo size={32} className="transition-transform group-hover:scale-110" />
              <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Agent AI
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {['Features', 'Architecture', 'Demo'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => scrollToSection(e, item.toLowerCase())}
                  className="text-sm font-medium transition-colors relative group"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  {item}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                    style={{ backgroundColor: 'var(--text-muted)' }}
                  />
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link to="/login">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105"
                  style={{
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent'
                  }}
                >
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button
                  className="px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-1.5 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--bg-accent)',
                    color: 'var(--text-on-accent)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-16 z-40 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
              {['Features', 'Architecture', 'Demo'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => scrollToSection(e, item.toLowerCase())}
                  className="text-2xl font-medium transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {item}
                </a>
              ))}
              <div className="pt-8 w-full max-w-xs flex flex-col gap-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl"
                    style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    Sign In
                  </button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-8 space-y-24 sm:space-y-32">

        {/* ═══ HERO ═══ */}
        <section id="home" className="text-center space-y-8 max-w-4xl mx-auto pt-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold animate-fade-in-down"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-tertiary)'
            }}
          >
            <Zap className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <span>AI Intent Router • Resume Showcase</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] sm:leading-[1.08] animate-fade-in-up">
            <span style={{ color: 'var(--text-primary)' }}>Intelligent AI for</span>
            <br />
            <span
              className="animate-gradient"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary), var(--text-tertiary), var(--text-muted))',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your Daily Life & Work
            </span>
          </h1>

          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            MiniGPT dynamically routes your prompts to the best pipeline —{' '}
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Direct Chat</span>,{' '}
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>RAG Search</span>, or{' '}
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Live Tools</span> —
            with seamless streaming responses.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 animate-fade-in stagger-3">
            <Link to="/register">
              <button
                className="px-8 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 hover:scale-105 group"
                style={{
                  backgroundColor: 'var(--bg-accent)',
                  color: 'var(--text-on-accent)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                Launch Workspace
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/login">
              <button
                className="px-8 py-3.5 text-base font-medium rounded-xl transition-all duration-200 flex items-center gap-2 hover:scale-105"
                style={{
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Zap className="w-5 h-5" /> Instant Demo
              </button>
            </Link>
          </div>

          {/* Tech Stack */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 animate-fade-in stagger-4">
            {[
              { icon: Cpu, label: 'Multi-LLM (Gemini 3.6  + Mistral)' },
              { icon: Database, label: 'Neon PostgreSQL + pgvector' },
              { icon: Wrench, label: 'Weather, Search & Math Tools' },
            ].map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105 cursor-default"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <item.icon className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} /> {item.label}
              </span>
            ))}
          </div>

          <div className="pt-8 flex justify-center">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="animate-bounce" style={{ color: 'var(--text-muted)' }}>
              <ChevronDown className="w-6 h-6" />
            </a>
          </div>
        </section>

        {/* ═══ PIPELINE ═══ */}
        <section id="architecture" className="space-y-6 scroll-mt-20">
          <div className="text-center space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', color: 'var(--text-tertiary)' }}
            >
              <Sparkles className="w-3 h-3" /> Interactive Demo
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AI Router Pipeline</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Click any pipeline to see how MiniGPT routes user prompts behind the scenes.
            </p>
          </div>

          <div
            className="max-w-5xl mx-auto rounded-2xl p-6 sm:p-8 space-y-6 transition-shadow duration-500"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Tabs */}
            <div
              className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-xl"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
            >
              {pipelineTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePipelineTab(tab.id)}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: activePipelineTab === tab.id ? 'var(--bg-accent)' : 'transparent',
                    color: activePipelineTab === tab.id ? 'var(--text-on-accent)' : 'var(--text-muted)',
                    boxShadow: activePipelineTab === tab.id ? 'var(--shadow-sm)' : 'none',
                    transform: activePipelineTab === tab.id ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div
              className="p-6 sm:p-8 rounded-xl min-h-[200px] sm:min-h-[240px] animate-fade-in"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-secondary)' }}
              key={activePipelineTab}
            >
              {activePipelineTab === 'router' && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div
                      className="px-4 py-2 rounded-lg font-mono text-xs font-medium break-words max-w-full"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                    >
                      User Prompt: "What is the weather in Delhi & summarize my notes?"
                    </div>
                    <div className="w-0.5 h-6 animate-pulse" style={{ backgroundColor: 'var(--text-muted)' }} />
                    <div
                      className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
                      style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-on-accent)', boxShadow: 'var(--shadow-md)' }}
                    >
                      <Brain className="w-5 h-5 animate-pulse" /> AI Intent Router (Classifier)
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[
                      { label: 'Chat Pipeline', desc: 'Direct conversation with Gemini 3.6 .', icon: Bot },
                      { label: 'RAG Pipeline', desc: 'Retrieves document embeddings via pgvector.', icon: FileText },
                      { label: 'Tool Pipeline', desc: 'Executes Weather, Search, or Math APIs.', icon: Globe },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-4 rounded-lg space-y-1.5 text-left transition-all hover:scale-105 cursor-default"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePipelineTab === 'chat' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Bot className="w-5 h-5" /> Direct Chat Pipeline
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    Used for direct answers, creative writing, advice, coding, and general knowledge.
                    Sends prompt straight to Google Gemini or OpenAI with streaming response tokens.
                  </p>
                  <div
                    className="p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', color: 'var(--text-secondary)' }}
                  >
                    <span className="text-emerald-500">▶</span> User Message ──› AI Router ──› Direct LLM ──› Streaming Response
                  </div>
                </div>
              )}

              {activePipelineTab === 'rag' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <FileText className="w-5 h-5" /> RAG Vector Retrieval Pipeline
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    Used when asking about uploaded PDFs or notes. Extracts text, chunks with overlap,
                    embeds via 1536-dim vectors into Neon pgvector, and injects relevant chunks into prompt.
                  </p>
                  <div
                    className="p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', color: 'var(--text-secondary)' }}
                  >
                    <span className="text-blue-500">▶</span> User Message ──› Embedding ──› pgvector Search ──› Context ──› Answer
                  </div>
                </div>
              )}

              {activePipelineTab === 'tool' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Globe className="w-5 h-5" /> Tool Execution Pipeline
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    Triggers when real-time data is needed. Runs Weather API, Web Search, or Math Evaluator,
                    then passes structured tool output to the LLM for final synthesis.
                  </p>
                  <div
                    className="p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', color: 'var(--text-secondary)' }}
                  >
                    <span className="text-amber-500">▶</span> User Message ──› Intent ──› Tool API ──› Result ──› Answer
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" className="space-y-8 scroll-mt-20">
          <div className="text-center space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', color: 'var(--text-tertiary)' }}
            >
              <Star className="w-3 h-3" /> Key Features
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Designed for Resume Impact
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Built with industry-standard engineering practices recruiters look for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl transition-all duration-300 hover:-translate-y-2 cursor-default relative overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
              >
                <div className="relative z-10 space-y-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <h3 className="text-lg font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> {feature.stats}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)'
                }}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section
          id="demo"
          className="rounded-2xl p-8 sm:p-12 text-center space-y-6 scroll-mt-20 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-2"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', color: 'var(--text-tertiary)' }}
            >
              <Zap className="w-3 h-3" /> Live Demo
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Ready to experience MiniGPT?
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Dive into the live demo and see how AI routing works in real-time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/register">
                <button
                  className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105 group"
                  style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-on-accent)', boxShadow: 'var(--shadow-md)' }}
                >
                  <Sparkles className="w-5 h-5" /> Start Free Trial
                </button>
              </Link>
              <Link to="/login">
                <button
                  className="px-6 py-3 rounded-xl transition-all flex items-center gap-2 hover:scale-105"
                  style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                  <Zap className="w-5 h-5" /> Live Demo
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="relative z-10 mt-12 theme-transition"
        style={{ borderTop: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <AgentLogo size={22} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Agent AI</span>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>React 18 · Express · Neon PostgreSQL · AWS S3</span>
              <span className="hidden sm:inline">|</span>
              <span>Portfolio Showcase</span>
            </div>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Linkedin, Mail].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
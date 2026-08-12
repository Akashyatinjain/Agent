import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Database, Wrench, Shield,
  CheckCircle2, Zap, Terminal, Layers, PlayCircle, Cpu,
  Menu, X, Github, Twitter, Linkedin, Mail,
  Sparkles, Code, Cloud, Bot, FileText, Globe,
  ChevronDown, Star, Users, Clock, Award
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [activePipelineTab, setActivePipelineTab] = useState('router');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll for anchor links
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col selection:bg-gray-600 selection:text-white relative overflow-x-hidden">

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-bl from-white/5 to-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-gradient-to-tr from-white/5 to-white/10 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute top-2/3 left-1/4 w-64 h-64 bg-gradient-to-r from-white/5 to-white/10 rounded-full blur-3xl animate-pulse delay-1500" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* ===== NAVIGATION ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group relative">
              <div className="absolute inset-0 bg-white/5 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/logo.svg" alt="MiniGPT Logo" className="w-9 h-9 relative z-10" />
              <span className="font-bold text-xl tracking-tight text-white relative z-10">
                MiniGPT
                <span className="absolute -top-1 -right-6 text-[8px] font-normal text-gray-500">™</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {['Features', 'Architecture', 'Demo'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => scrollToSection(e, item.toLowerCase())}
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/50 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 hover:scale-105">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-5 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-gray-200 transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-white/5 hover:shadow-white/20 hover:scale-105">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors relative z-50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Slide from right */}
        <div className={`md:hidden fixed inset-0 bg-black/95 backdrop-blur-xl transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}>
          <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
            {['Features', 'Architecture', 'Demo'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => scrollToSection(e, item.toLowerCase())}
                className="text-2xl font-medium text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="pt-8 border-t border-white/5 w-full max-w-xs flex flex-col gap-4">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">
                  Sign In
                </button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-white text-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-20 sm:space-y-28">

        {/* ===== HERO SECTION ===== */}
        <section id="home" ref={heroRef} className="text-center space-y-8 max-w-4xl mx-auto pt-8">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-semibold backdrop-blur-sm animate-bounce-slow">
            <Zap className="w-4 h-4 text-gray-300" />
            <span>AI Intent Router • Resume Showcase</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Main Heading with Gradient */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-white">Intelligent AI for</span>
            <br />
            <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent animate-gradient">
              Your Daily Life & Work
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            MiniGPT dynamically routes your prompts to the best pipeline —
            <span className="text-gray-200 font-medium"> Direct Chat</span>,
            <span className="text-gray-200 font-medium"> RAG Search</span>, or
            <span className="text-gray-200 font-medium"> Live Tools</span> —
            with seamless streaming responses.
          </p>

          {/* CTAs with Hover Effects */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/register">
              <button className="px-8 py-3.5 text-base font-semibold rounded-xl bg-white text-black hover:bg-gray-200 shadow-2xl shadow-white/10 transition-all duration-200 flex items-center gap-2 hover:scale-105 hover:shadow-white/20 group">
                Launch Workspace
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 text-base font-medium rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 flex items-center gap-2 hover:scale-105">
                <Zap className="w-5 h-5" /> Instant Demo
              </button>
            </Link>
          </div>

          {/* Tech Stack Badges with Hover */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Cpu, label: 'Multi-LLM (Gemini 3.6 + GPT-4o + Mistral)' },
              { icon: Database, label: 'Neon PostgreSQL + pgvector' },
              { icon: Wrench, label: 'Weather, Search & Math Tools' },
            ].map((item, idx) => (
              <span key={idx} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-gray-400 flex items-center gap-1.5 hover:bg-white/10 transition-all hover:scale-105 cursor-default">
                <item.icon className="w-3.5 h-3.5 text-gray-300" /> {item.label}
              </span>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="pt-8 flex justify-center">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-gray-500 hover:text-gray-300 transition-colors animate-bounce">
              <ChevronDown className="w-6 h-6" />
            </a>
          </div>
        </section>

        {/* ===== INTERACTIVE PIPELINE ===== */}
        <section id="architecture" className="space-y-6 scroll-mt-20">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400">
              <Sparkles className="w-3 h-3" /> Interactive Demo
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              AI Router Pipeline
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Click any pipeline to see how MiniGPT routes user prompts behind the scenes.
            </p>
          </div>

          <div className="max-w-5xl mx-auto bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6 shadow-2xl hover:shadow-white/5 transition-shadow duration-500">
            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
              {[
                { id: 'router', label: '🧠 Full AI Router Flow' },
                { id: 'chat', label: '💬 Chat Pipeline' },
                { id: 'rag', label: '📚 RAG Pipeline' },
                { id: 'tool', label: '🔧 Tool Pipeline' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePipelineTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activePipelineTab === tab.id
                      ? 'bg-white/10 text-white shadow-lg shadow-white/5 scale-105'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pipeline Content */}
            <div className="p-6 sm:p-8 rounded-xl bg-black/30 border border-white/5 min-h-[180px] sm:min-h-[240px] transition-all duration-300">
              {/* Router View */}
              {activePipelineTab === 'router' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-medium text-gray-300 break-words max-w-full">
                      User Prompt: "What is the weather in Delhi & summarize my notes?"
                    </div>
                    <div className="relative w-0.5 h-6">
                      <div className="absolute inset-0 bg-gradient-to-b from-gray-500 to-gray-400 animate-pulse" />
                    </div>
                    <div className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm shadow-lg flex items-center gap-2 border border-white/5 hover:bg-white/15 transition-all">
                      <Brain className="w-5 h-5 animate-pulse" /> AI Intent Router (Classifier)
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[
                      { label: 'Chat Pipeline', desc: 'Direct conversation with Gemini 1.5 or GPT-4o.', icon: Bot },
                      { label: 'RAG Pipeline', desc: 'Retrieves document embeddings via pgvector.', icon: FileText },
                      { label: 'Tool Pipeline', desc: 'Executes Weather, Search, or Math APIs.', icon: Globe },
                    ].map((item) => (
                      <div key={item.label} className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1.5 text-left hover:bg-white/10 transition-all hover:scale-105 cursor-default">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold text-gray-300 uppercase">{item.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat View */}
              {activePipelineTab === 'chat' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                    <Bot className="w-5 h-5" /> Direct Chat Pipeline
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Used for direct answers, creative writing, advice, coding, and general knowledge.
                    Sends prompt straight to Google Gemini or OpenAI with streaming response tokens.
                  </p>
                  <div className="p-3 rounded-lg bg-black/50 font-mono text-xs text-gray-300 border border-white/5 overflow-x-auto whitespace-pre-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">▶</span>
                      User Message ──> AI Router ──> Direct LLM ──> Streaming Response
                    </div>
                  </div>
                </div>
              )}

              {/* RAG View */}
              {activePipelineTab === 'rag' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                    <FileText className="w-5 h-5" /> RAG Vector Retrieval Pipeline
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Used when asking about uploaded PDFs or notes. Extracts text, chunks with overlap,
                    embeds via 1536-dim vectors into Neon pgvector, and injects relevant chunks into prompt.
                  </p>
                  <div className="p-3 rounded-lg bg-black/50 font-mono text-xs text-gray-300 border border-white/5 overflow-x-auto whitespace-pre-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">▶</span>
                      User Message ──> Embedding ──> pgvector Search ──> Context ──> Answer
                    </div>
                  </div>
                </div>
              )}

              {/* Tool View */}
              {activePipelineTab === 'tool' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                    <Globe className="w-5 h-5" /> Tool Execution Pipeline
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Triggers when real-time data is needed. Runs Weather API, Web Search, or Math Evaluator,
                    then passes structured tool output to the LLM for final synthesis.
                  </p>
                  <div className="p-3 rounded-lg bg-black/50 font-mono text-xs text-gray-300 border border-white/5 overflow-x-auto whitespace-pre-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">▶</span>
                      User Message ──> Intent ──> Tool API ──> Result ──> Answer
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" ref={featuresRef} className="space-y-8 scroll-mt-20">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400">
              <Star className="w-3 h-3" /> Key Features
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Designed for Resume Impact
            </h2>
            <p className="text-sm text-gray-500">
              Built with industry-standard engineering practices recruiters look for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
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
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-white/5 space-y-3 cursor-default relative overflow-hidden"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Background Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400">
                    <CheckCircle2 className="w-3 h-3" /> {feature.stats}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { icon: Users, label: 'Active Users', value: '2.5K+' },
              { icon: Clock, label: 'Avg Response', value: '<2s' },
              { icon: Award, label: 'Accuracy Rate', value: '98.5%' },
              { icon: Code, label: 'Lines of Code', value: '15K+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all hover:scale-105">
                <stat.icon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== DEMO / CTA BANNER ===== */}
        <section id="demo" className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 p-8 sm:p-12 text-center space-y-6 scroll-mt-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 mb-2">
              <PlayCircle className="w-3 h-3" /> Live Demo
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to experience MiniGPT?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Dive into the live demo and see how AI routing works in real-time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/register">
                <button className="px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-white/10 group">
                  <PlayCircle className="w-5 h-5 group-hover:animate-spin" /> Start Free Trial
                </button>
              </Link>
              <Link to="/login">
                <button className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all flex items-center gap-2 hover:scale-105">
                  <Terminal className="w-5 h-5" /> Live Demo
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-white/5 bg-black/30 backdrop-blur-xl mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="MiniGPT Logo" className="w-5 h-5" />
              <span className="text-sm font-medium text-gray-400">MiniGPT 2026</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500 break-words">
              <span>React 18 · Express · Neon PostgreSQL · AWS S3</span>
              <span className="hidden sm:inline">|</span>
              <span>Portfolio Showcase</span>
            </div>
            <div className="flex items-center gap-4">
              {[Github, Twitter, Linkedin, Mail].map((Icon, idx) => (
                <a key={idx} href="#" className="p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all hover:scale-110">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }

        /* Smooth scrolling for the whole page */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
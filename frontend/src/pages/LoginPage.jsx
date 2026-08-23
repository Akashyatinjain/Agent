import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { loginApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/ui/ThemeToggle';

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleLoginAttempt = async (loginEmail, loginPassword) => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await loginApi(loginEmail, loginPassword);
      if (res.success && res.token) {
        setAuth(res.user, res.token);
        navigate('/chat');
      } else {
        const errVal = res.error;
        const msg = (typeof errVal === 'object' ? errVal?.message : errVal) || 'Invalid email or password';
        setErrorMessage(msg);
      }
    } catch (err) {
      const errorData = err.response?.data?.error;
      const msg = (typeof errorData === 'object' ? errorData?.message : errorData) || err.message || 'Login failed. Server might be offline.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleLoginAttempt(email, password);
  };

  const handleDemoLogin = () => {
    handleLoginAttempt('demo@minigpt.dev', 'password123');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none animate-orb-1" style={{ backgroundColor: 'var(--orb-color)' }} />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none animate-orb-2" style={{ backgroundColor: 'var(--orb-color)' }} />

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-20 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-tertiary)'
          }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up my-auto">
        {/* Brand */}
        <div className="text-center mb-5 sm:mb-6 mt-12 sm:mt-0">
          <div className="flex items-center justify-center gap-2.5 mb-2 sm:mb-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}
            >
              M
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>MiniGPT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to continue your AI journey</p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {/* Instant Demo Login Banner */}
          <div
            className="p-3 rounded-xl flex items-center justify-between gap-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 shrink-0 text-amber-500" />
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  Recruiter / Demo Mode
                </span>
                <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  Try immediately without sign up
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 hover:scale-105 cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)'
              }}
            >
              Instant <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {errorMessage && (
            <div
              className="p-3 rounded-xl text-xs flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444'
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-words">{String(errorMessage)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl text-sm pr-10 transition-all duration-200 focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-current"
                  style={{ accentColor: 'var(--bg-accent)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--text-on-accent)', borderTopColor: 'transparent' }} />
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold underline" style={{ color: 'var(--text-primary)' }}>
              Create account
            </Link>
          </p>
        </div>

        {/* Trust Footer */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Authentication</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
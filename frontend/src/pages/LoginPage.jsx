import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await loginApi(email, password);
      if (res.success && res.token) {
        setAuth(res.user, res.token);
        navigate('/chat');
      } else {
        setErrorMessage(res.error || 'Invalid email or password');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Server might be offline.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
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
        <div className="text-center mb-6 sm:mb-8 mt-12 sm:mt-0">
          <div className="flex items-center justify-center gap-2.5 mb-3 sm:mb-4">
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
          className="rounded-2xl p-6 sm:p-8"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {errorMessage && (
            <div
              className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444'
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 transition-colors"
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
              <Link to="/forgot-password" className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
                Forgot password?
              </Link>
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border-primary)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>or continue with</span>
            </div>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            {['Google', 'GitHub'].map((provider) => (
              <button
                key={provider}
                type="button"
                className="py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--border-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                >
                  {provider[0]}
                </span>
                {provider}
              </button>
            ))}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
              Create one now
            </Link>
          </p>
        </div>

        {/* Trust */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Login</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
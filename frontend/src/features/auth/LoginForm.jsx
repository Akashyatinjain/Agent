import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Sparkles, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { loginApi } from '../../api/auth';
import useAuthStore from '../../store/authStore';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (userEmail, userPassword) => {
    setError('');
    setLoading(true);

    try {
      const data = await loginApi(userEmail, userPassword);
      if (data.success && data.token) {
        setAuth(data.user, data.token);
        navigate('/chat');
      } else {
        setError(data.error?.message || data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    handleLogin(email.trim(), password);
  };

  const handleDemoLogin = () => {
    handleLogin('demo@minigpt.dev', 'password123');
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div
        className="p-6 sm:p-8 rounded-3xl space-y-6 transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-110"
            style={{
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome Back
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sign in to access your MiniGPT AI Workspace
          </p>
        </div>

        {/* 1-Click Instant Demo Login Banner */}
        <div
          className="p-3.5 rounded-2xl flex items-center justify-between gap-2 transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                Recruiter / Demo Mode
              </span>
              <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                Try instantly without signing up
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-on-accent)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Instant <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {error && (
          <div
            className="p-3 rounded-xl flex items-center gap-2 text-xs font-medium"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444'
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="w-full py-3 font-bold text-sm" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Workspace'}
          </Button>
        </form>

        <div
          className="pt-4 text-center text-xs"
          style={{
            borderTop: '1px solid var(--border-secondary)',
            color: 'var(--text-muted)'
          }}
        >
          Don't have an account?{' '}
          <Link to="/register" className="font-bold underline" style={{ color: 'var(--text-primary)' }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

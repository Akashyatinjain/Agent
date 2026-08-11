import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Sparkles, Zap, ArrowRight } from 'lucide-react';
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
      if (data.success) {
        setAuth(data.user, data.token);
        navigate('/chat');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleDemoLogin = () => {
    handleLogin('demo@minigpt.dev', 'password123');
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white mx-auto shadow-xl shadow-slate-900/40 ring-1 ring-white/10 animate-bounce">
            <Sparkles className="w-7 h-7 text-gray-200" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-gray-400">Sign in to access your MiniGPT AI Workspace</p>
        </div>

        {/* 1-Click Instant Demo Login Banner */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-300 flex-shrink-0 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">Recruiter / Demo Mode</span>
              <span className="text-[10px] text-gray-400">Try without signing up</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold transition-all shadow-md shadow-slate-900/20 flex items-center gap-1 disabled:opacity-50"
          >
            Instant Login <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs font-medium text-center">
            {error}
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

          <Button type="submit" variant="primary" className="w-full py-3 font-bold text-sm shadow-slate-900/20 shadow-xl" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Workspace'}
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-gray-200 font-bold hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

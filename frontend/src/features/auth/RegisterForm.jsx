import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { registerApi } from '../../api/auth';
import useAuthStore from '../../store/authStore';

export const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await registerApi(name.trim(), email.trim(), password);
      if (data.success && data.token) {
        setAuth(data.user, data.token);
        navigate('/chat');
      } else {
        setError(data.error?.message || data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
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
            Create Account
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Join your personal MiniGPT AI workspace
          </p>
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
            label="Full Name"
            type="text"
            icon={User}
            placeholder="Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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

          <div className="space-y-1.5 pt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Multi-Provider LLM Router (Gemini + OpenAI + Mistral)
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> pgvector RAG Document Storage & Semantic Search
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3 font-bold text-sm" disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started Now'}
          </Button>
        </form>

        <div
          className="pt-4 text-center text-xs"
          style={{
            borderTop: '1px solid var(--border-secondary)',
            color: 'var(--text-muted)'
          }}
        >
          Already have an account?{' '}
          <Link to="/login" className="font-bold underline" style={{ color: 'var(--text-primary)' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;

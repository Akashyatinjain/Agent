import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
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
    setError('');
    setLoading(true);

    try {
      const data = await registerApi(name, email, password);
      if (data.success) {
        setAuth(data.user, data.token);
        navigate('/chat');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow accent */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white mx-auto shadow-xl shadow-slate-900/40 ring-1 ring-white/10">
            <Sparkles className="w-7 h-7 text-gray-200" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-xs text-gray-400">Join your personal MiniGPT AI workspace</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Full Name"
            type="text"
            icon={User}
            placeholder="Akash Sharma"
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

          <div className="space-y-1.5 pt-1 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 text-gray-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" /> Free Access to Gemini & OpenAI Router
            </div>
            <div className="flex items-center gap-1.5 text-gray-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" /> Vector Document Storage & Search
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3 font-bold text-sm shadow-slate-900/20 shadow-xl" disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started Now'}
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-200 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;

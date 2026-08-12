import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Mail, Lock, Eye, EyeOff,
  ArrowRight, Shield, CheckCircle2, User, AlertCircle,
  Github, Twitter, Linkedin
} from 'lucide-react';
import { registerApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/ui/ThemeToggle';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name] || errors.submit) {
      setErrors(prev => ({ ...prev, [name]: '', submit: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await registerApi(formData.name, formData.email, formData.password);
      if (res.success && res.token) {
        setAuth(res.user, res.token);
        navigate('/chat');
      } else {
        setErrors({ submit: res.error || 'Registration failed' });
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message || 'Registration failed. Server might be offline.';
      setErrors({ submit: serverMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    backgroundColor: 'var(--bg-input)',
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'var(--border-primary)'}`,
    color: 'var(--text-primary)',
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background Orbs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none animate-orb-1" style={{ backgroundColor: 'var(--orb-color)' }} />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none animate-orb-2" style={{ backgroundColor: 'var(--orb-color)' }} />

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

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up my-auto">
        {/* Brand */}
        <div className="text-center mb-4 sm:mb-6 mt-12 sm:mt-0">
          <div className="flex items-center justify-center gap-2.5 mb-2 sm:mb-4">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}
            >
              M
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>MiniGPT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Start your AI journey today</p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {errors.submit && (
            <div
              className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444'
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                style={inputStyle(errors.name)}
              />
              {errors.name && (
                <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                style={inputStyle(errors.email)}
              />
              {errors.email && (
                <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl text-sm pr-10 transition-all duration-200 focus:outline-none"
                  style={inputStyle(errors.password)}
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
              {errors.password && (
                <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                <Lock className="w-3.5 h-3.5" /> Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2.5 rounded-xl text-sm pr-10 transition-all duration-200 focus:outline-none"
                  style={inputStyle(errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded cursor-pointer"
                  style={{ accentColor: 'var(--bg-accent)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#ef4444' }}>
                  <AlertCircle className="w-3 h-3" /> {errors.agreeTerms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-accent)',
                color: 'var(--text-on-accent)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--text-on-accent)', borderTopColor: 'transparent' }} />
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border-primary)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>or sign up with</span>
            </div>
          </div>

          {/* Social */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Github, label: 'GitHub' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Linkedin, label: 'LinkedIn' },
            ].map((provider) => (
              <button
                key={provider.label}
                type="button"
                className="py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--border-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <provider.icon className="w-3.5 h-3.5" />
                {provider.label}
              </button>
            ))}
          </div>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
              Sign in instead
            </Link>
          </p>
        </div>

        {/* Trust */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Registration</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Encrypted Data</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
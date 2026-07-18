import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle, X, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'login' | 'signup';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading, error, clearError } = useAuth();

  const resetFields = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    try {
      await login(username.trim(), password);
      onClose();
      resetFields();
    } catch {
      // error handled by context
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password.trim()) return;
    if (password !== confirmPassword) return;
    try {
      await register(email.trim(), username.trim(), password);
      onClose();
      resetFields();
    } catch {
      // error handled by context
    }
  };

  const handleClose = () => {
    clearError();
    resetFields();
    onClose();
  };

  const handleTabSwitch = (newTab: AuthTab) => {
    setTab(newTab);
    clearError();
    resetFields();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] bg-bg-secondary rounded-2xl shadow-lg border border-border overflow-hidden animate-scale-in">
        {/* Header with brand */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-accent" />
            <span className="text-lg font-semibold text-text-primary">BakaReader</span>
          </div>
          <p className="text-sm text-text-muted">
            {tab === 'login' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="px-6 mb-4">
          <div className="flex p-1 rounded-xl bg-bg-tertiary">
            <button
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <LogIn size={14} />
              Login
            </button>
            <button
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'signup'
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <UserPlus size={14} />
              Sign Up
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="px-6 pb-6">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-error/10 border border-error/20 mb-4">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error leading-snug">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-11 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    Sign In
                  </>
                )}
              </button>

              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                Works with local accounts and MangaDex credentials
              </p>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Pick a username"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-4 py-3 pr-11 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                  disabled={isLoading}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} />
                    Passwords don't match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !username.trim() || !password.trim() || password !== confirmPassword}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Create Account
                  </>
                )}
              </button>

              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                Account data is stored locally in your browser
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

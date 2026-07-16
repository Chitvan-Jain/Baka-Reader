import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';
import Modal from './ui/Modal';
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

  const inputClass = "w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-colors disabled:opacity-50";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Account">
      {/* Tabs */}
      <div className="flex mb-4 p-0.5 rounded-lg bg-bg-tertiary">
        <button
          onClick={() => handleTabSwitch('login')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'login' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <LogIn size={14} />
          Login
        </button>
        <button
          onClick={() => handleTabSwitch('signup')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'signup' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <UserPlus size={14} />
          Sign Up
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-error/10 border border-error/20 mb-3">
          <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Login Form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your username"
              className={inputClass}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className={`${inputClass} pr-9`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={14} />
                Sign In
              </>
            )}
          </button>

          <p className="text-[11px] text-text-muted text-center pt-1">
            Works with local accounts and MangaDex credentials
          </p>
        </form>
      )}

      {/* Sign Up Form */}
      {tab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Pick a username"
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a password"
                className={`${inputClass} pr-9`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={inputClass}
              disabled={isLoading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-error mt-1">Passwords don't match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !username.trim() || !password.trim() || password !== confirmPassword}
            className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Create Account
              </>
            )}
          </button>

          <p className="text-[11px] text-text-muted text-center pt-1">
            Account data is stored locally in your browser
          </p>
        </form>
      )}
    </Modal>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Library, List, User, LogIn, Menu, X, BookOpen } from 'lucide-react';
import SearchBar from './SearchBar';
import LoginModal from './LoginModal';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/library', label: 'Library', icon: Library },
    { to: '/lists', label: 'Reading Lists', icon: List },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-glass-border">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative">
                <BookOpen size={28} className="text-accent group-hover:drop-shadow-[0_0_8px_rgba(255,107,107,0.5)] transition-all" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-text-primary leading-none">
                  Baka<span className="text-accent">Reader</span>
                </span>
                <span className="text-[9px] font-medium text-text-muted tracking-widest uppercase leading-none mt-0.5 hidden sm:block">
                  マンガリーダー
                </span>
              </div>
            </Link>

            {/* Search Bar (desktop) */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            {/* Nav Links (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.to)
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 ml-4">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-tertiary hover:bg-bg-hover transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{user.username[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary hidden lg:block">{user.username}</span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border rounded-xl shadow-card overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-text-primary">{user.username}</p>
                        <p className="text-xs text-text-muted">MangaDex Account</p>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-bg-tertiary transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all hover:shadow-glow"
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-bg-secondary animate-slide-down">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.to)
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Profile menu backdrop */}
      {profileMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
      )}

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}

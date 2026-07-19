import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Library, List, LogIn, Menu, X, BookOpen, Sun, Moon,
  CheckCircle2, Clock, TrendingUp, Sparkles
} from 'lucide-react';
import SearchBar from './SearchBar';
import LoginModal from './LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/library', label: 'Library', icon: Library },
    { to: '/lists', label: 'Lists', icon: List },
  ];

  const browseLinks = [
    { to: '/search?status=completed&sort=followedCount:desc', label: 'Completed', icon: CheckCircle2 },
    { to: '/search?sort=latestUploadedChapter:desc', label: 'Latest', icon: Clock },
    { to: '/search?sort=followedCount:desc', label: 'Popular', icon: TrendingUp },
    { to: '/search?sort=createdAt:desc', label: 'New', icon: Sparkles },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isBrowseActive = (to: string) => location.pathname + location.search === to;

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-glass-border">
        <div className="site-container">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <BookOpen size={24} className="text-accent" />
              <span className="text-base font-semibold text-text-primary tracking-tight">
                BakaReader
              </span>
            </Link>

            {/* Search (desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <SearchBar />
            </div>

            {/* Nav (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon size={15} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 ml-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-white">{user.username[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary hidden lg:block">{user.username}</span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in">
                      <div className="px-3.5 py-2.5 border-b border-border">
                        <p className="text-sm font-medium text-text-primary">{user.username}</p>
                        <p className="text-xs text-text-muted">Account</p>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-sm text-error hover:bg-bg-tertiary transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
                >
                  <LogIn size={14} />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Browse bar (desktop) — below the main header row */}
          <div className="hidden md:flex items-center gap-1 pb-2 -mt-0.5">
            {browseLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    isBrowseActive(link.to)
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon size={12} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-2.5">
            <SearchBar />
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-bg-secondary animate-slide-down">
            <nav className="px-4 py-2 space-y-0.5">
              {navLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}

              {/* Browse links in mobile */}
              <div className="border-t border-border mt-1.5 pt-1.5">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Browse</p>
                {browseLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isBrowseActive(link.to)
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      <Icon size={16} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
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

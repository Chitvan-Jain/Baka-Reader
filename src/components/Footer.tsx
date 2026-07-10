import { Link } from 'react-router-dom';
import { BookOpen, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary mt-16">
      <div className="max-w-full mx-auto px-4 md:px-6">
        {/* Main footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <BookOpen size={24} className="text-accent" />
              <span className="text-lg font-bold text-text-primary">
                Baka<span className="text-accent">Reader</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Read your favorite manga seamlessly, anytime, anywhere. Powered by MangaDex API.
            </p>
            <p className="text-xs text-text-muted">マンガリーダー · 漫画を読む</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/library', label: 'My Library' },
                { to: '/lists', label: 'Reading Lists' },
                { to: '/search', label: 'Browse Manga' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {[
                { href: 'https://api.mangadex.org/docs/', label: 'API Documentation', external: true },
                { href: 'https://mangadex.org', label: 'MangaDex', external: true },
                { href: 'https://status.mangadex.org', label: 'API Status', external: true },
              ].map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && <ExternalLink size={11} />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {['About', 'Privacy Policy', 'Terms of Use', 'Contact'].map(label => (
                <li key={label}>
                  <a href="#" className="text-sm text-text-secondary hover:text-accent transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Baka Reader. All manga data provided by{' '}
            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              MangaDex
            </a>
            .
          </p>
          <p className="text-xs text-text-muted flex items-center gap-1">
            Made with <Heart size={12} className="text-accent" /> for manga readers
          </p>
        </div>
      </div>

      {/* Japanese decorative line */}
      <div className="h-1 bg-gradient-to-r from-accent via-accent-secondary to-accent-tertiary opacity-50" />
    </footer>
  );
}

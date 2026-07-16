import { Link } from 'react-router-dom';
import { BookOpen, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary/50 mt-12">
      <div className="site-container">
        <div className="py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <BookOpen size={20} className="text-accent" />
              <span className="text-base font-semibold text-text-primary">BakaReader</span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              Read your favorite manga seamlessly. Powered by MangaDex API.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/library', label: 'Library' },
                { to: '/lists', label: 'Reading Lists' },
                { to: '/search', label: 'Browse' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Resources</h3>
            <ul className="space-y-2">
              {[
                { href: 'https://api.mangadex.org/docs/', label: 'API Docs', external: true },
                { href: 'https://mangadex.org', label: 'MangaDex', external: true },
                { href: 'https://status.mangadex.org', label: 'API Status', external: true },
              ].map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && <ExternalLink size={10} />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Legal</h3>
            <ul className="space-y-2">
              {['About', 'Privacy', 'Terms', 'Contact'].map(label => (
                <li key={label}>
                  <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} BakaReader. Data by{' '}
            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary">
              MangaDex
            </a>
          </p>
          <p className="text-xs text-text-muted flex items-center gap-1">
            Made with <Heart size={10} className="text-accent" /> for manga readers
          </p>
        </div>
      </div>
    </footer>
  );
}

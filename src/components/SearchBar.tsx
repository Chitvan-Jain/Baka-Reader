import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock } from 'lucide-react';
import { searchManga } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl } from '../types';
import { addRecentSearch, getRecentSearches, clearRecentSearches } from '../services/storage';
import type { Manga } from '../types';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Manga[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchManga({ title: query.trim() }, 0, 6);
        setResults(res.data);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query.trim();
    if (!q) return;
    addRecentSearch(q);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    setQuery('');
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
  };

  const handleMangaClick = (mangaId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/manga/${mangaId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search manga..."
          className="w-full h-9 pl-9 pr-8 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query.trim().length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full mt-1.5 w-full bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in z-50">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary">
              <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              Searching...
            </div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[11px] font-medium text-text-muted uppercase tracking-wider">Results</p>
              {results.map(manga => {
                const title = getMangaTitle(manga);
                const coverFile = getCoverFileName(manga);
                const coverUrl = getCoverUrl(manga.id, coverFile, '256');
                return (
                  <button
                    key={manga.id}
                    onClick={() => handleMangaClick(manga.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
                  >
                    <img
                      src={coverUrl}
                      alt={title}
                      className="w-8 h-11 rounded object-cover bg-bg-tertiary shrink-0"
                      referrerPolicy="no-referrer"
                      onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className += ' skeleton-shimmer'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                      <p className="text-xs text-text-muted truncate">
                        {manga.attributes.status && <span className="capitalize">{manga.attributes.status}</span>}
                        {manga.attributes.year && <span> · {manga.attributes.year}</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => handleSearch()}
                className="w-full px-3 py-2 text-sm text-accent hover:bg-bg-tertiary transition-colors text-center font-medium"
              >
                View all results for "{query}"
              </button>
            </div>
          )}

          {/* No results */}
          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <div className="px-3 py-5 text-center text-sm text-text-secondary">
              No manga found for "{query}"
            </div>
          )}

          {/* Recent searches */}
          {query.trim().length < 2 && recentSearches.length > 0 && (
            <div className="py-1">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Recent</p>
                <button
                  onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                  className="text-[11px] text-text-muted hover:text-accent transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map(search => (
                <button
                  key={search}
                  onClick={() => { setQuery(search); handleSearch(search); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-bg-tertiary transition-colors text-left"
                >
                  <Clock size={13} className="text-text-muted shrink-0" />
                  <span className="text-sm text-text-secondary">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

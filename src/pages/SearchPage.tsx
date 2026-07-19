import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { searchManga, getMangaTags } from '../services/mangadex';
import { getMangaTitle, getCoverFileName, getCoverUrl } from '../types';
import LazyImage from '../components/ui/LazyImage';
import Skeleton from '../components/ui/Skeleton';
import type { Manga, Tag, SearchFilters } from '../types';

const STATUS_OPTIONS = ['ongoing', 'completed', 'hiatus', 'cancelled'];
const DEMOGRAPHIC_OPTIONS = ['shounen', 'shoujo', 'seinen', 'josei'];
const CONTENT_RATING_OPTIONS = ['safe', 'suggestive', 'erotica'];
const SORT_OPTIONS = [
  { value: 'relevance:desc', label: 'Relevance' },
  { value: 'latestUploadedChapter:desc', label: 'Latest Updated' },
  { value: 'followedCount:desc', label: 'Most Popular' },
  { value: 'rating:desc', label: 'Highest Rated' },
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'title:asc', label: 'Title A-Z' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  // Read all filter params from URL
  const initStatus = searchParams.get('status');
  const initSort = searchParams.get('sort');
  const initTag = searchParams.get('tags');
  const initQ = searchParams.get('q');

  const [filters, setFilters] = useState<SearchFilters>({
    title: initQ || '',
    status: initStatus ? [initStatus] : [],
    publicationDemographic: [],
    contentRating: ['safe', 'suggestive'],
    includedTags: initTag ? [initTag] : [],
    sort: initSort || 'relevance:desc',
  });

  const LIMIT = 20;

  // Load tags
  useEffect(() => {
    getMangaTags().then(res => setTags(res.data)).catch(() => {});
  }, []);

  // Search on mount if any filter param exists
  useEffect(() => {
    if (initQ || initTag || initStatus || initSort) {
      performSearch({
        ...filters,
        title: initQ || '',
        includedTags: initTag ? [initTag] : filters.includedTags,
        status: initStatus ? [initStatus] : [],
        sort: initSort || 'relevance:desc',
      }, 0);
    }
  }, []);

  const performSearch = async (searchFilters: SearchFilters, searchOffset: number) => {
    setLoading(true);
    try {
      const res = await searchManga(searchFilters, searchOffset, LIMIT);
      if (searchOffset === 0) {
        setResults(res.data);
      } else {
        setResults(prev => [...prev, ...res.data]);
      }
      setTotal(res.total);
      setOffset(searchOffset + LIMIT);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const newFilters = { ...filters, title: query };
    setFilters(newFilters);
    setSearchParams(query ? { q: query } : {});
    performSearch(newFilters, 0);
  };

  const toggleFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const arr = (prev[key] as string[]) || [];
      const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  const genreTags = tags.filter(t => t.attributes.group === 'genre');
  const themeTags = tags.filter(t => t.attributes.group === 'theme').slice(0, 20);

  return (
    <div className="site-container py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-5">Search</h1>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, author..."
            className="w-full h-10 pl-9 pr-4 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>
        <button type="submit" className="px-4 h-10 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-10 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5 ${
            showFilters ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-bg-secondary border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <Filter size={14} />
          Filters
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="mb-5 p-4 bg-bg-secondary border border-border rounded-lg animate-slide-down space-y-4">
          {/* Sort */}
          <div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Sort</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, sort: opt.value }))}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    filters.sort === opt.value ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleFilter('status', s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filters.status?.includes(s) ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Demographic */}
          <div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Demographic</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMOGRAPHIC_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleFilter('publicationDemographic', d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filters.publicationDemographic?.includes(d) ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Content Rating */}
          <div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Content Rating</p>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_RATING_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => toggleFilter('contentRating', r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    filters.contentRating?.includes(r) ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          {genreTags.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Genres</p>
              <div className="flex flex-wrap gap-1">
                {genreTags.map(tag => {
                  const name = tag.attributes.name['en'] || Object.values(tag.attributes.name)[0];
                  const selected = filters.includedTags?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleFilter('includedTags', tag.id)}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                        selected ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => { handleSearch(); setShowFilters(false); }}
            className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Results count */}
      {total > 0 && (
        <p className="text-sm text-text-secondary mb-3">
          Found <span className="text-text-primary font-medium">{total.toLocaleString()}</span> manga
        </p>
      )}

      {/* Results grid */}
      {loading && results.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton height={200} className="rounded-lg" />
              <Skeleton height={14} width="80%" />
            </div>
          ))}
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="text-center py-14">
          <Search size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">
            {query ? `No results for "${query}"` : 'Search for manga to get started'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {results.map(manga => {
              const title = getMangaTitle(manga);
              const coverFile = getCoverFileName(manga);
              const coverUrl = getCoverUrl(manga.id, coverFile, '512');
              return (
                <Link key={manga.id} to={`/manga/${manga.id}`} className="group">
                  <div className="relative aspect-[3/4.2] rounded-lg overflow-hidden mb-2 bg-bg-tertiary">
                    <LazyImage
                      src={coverUrl}
                      alt={title}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                        manga.attributes.status === 'completed' ? 'bg-success/20 text-success' :
                        manga.attributes.status === 'ongoing' ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'
                      }`}>
                        {manga.attributes.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent transition-colors">{title}</h3>
                </Link>
              );
            })}
          </div>

          {offset < total && (
            <div className="text-center mt-6">
              <button
                onClick={() => performSearch(filters, offset)}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-bg-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : `Load More (${Math.min(offset, total)}/${total})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Settings, X,
  Maximize, Minimize, BookOpen, Columns2, AlignVerticalSpaceAround,
  FileText, Sun, ZoomIn, ZoomOut
} from 'lucide-react';
import { getChapterPages, getMangaFeed, getMangaDetails, buildChapterImageUrl } from '../services/mangadex';
import { saveReadingProgress, getReaderSettings, saveReaderSettings, markChapterRead, addToHistory } from '../services/storage';
import { getMangaTitle, getCoverFileName } from '../types';
import type { ReadingMode, Chapter } from '../types';

export default function ReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState(getReaderSettings());
  const [mangaId, setMangaId] = useState<string>('');
  const [mangaTitle, setMangaTitle] = useState('');
  const [chapterNum, setChapterNum] = useState<string | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);

  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load chapter pages
  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);
    setCurrentPage(0);

    getChapterPages(chapterId)
      .then(res => {
        const urls = res.chapter.data.map(file =>
          buildChapterImageUrl(res.baseUrl, res.chapter.hash, file, false)
        );
        setPages(urls);
        setLoading(false);

        // Mark chapter as read
        markChapterRead(chapterId);
      })
      .catch(err => {
        setError(err.message || 'Failed to load chapter');
        setLoading(false);
      });
  }, [chapterId]);

  // Load manga info for navigation
  useEffect(() => {
    if (!chapterId) return;
    // We need to find the manga ID from the chapter
    // First, get chapter info via the API
    fetch(`/api/chapter/${chapterId}?includes[]=manga`)
      .then(res => res.json())
      .then(data => {
        const ch = data.data;
        setChapterNum(ch.attributes.chapter);
        const mangaRel = ch.relationships.find((r: any) => r.type === 'manga');
        if (mangaRel) {
          setMangaId(mangaRel.id);
          // Get manga title
          getMangaDetails(mangaRel.id).then(mangaRes => {
            const title = getMangaTitle(mangaRes.data);
            setMangaTitle(title);
            const coverFile = getCoverFileName(mangaRes.data);

            // Add to history
            addToHistory({
              mangaId: mangaRel.id,
              mangaTitle: title,
              chapterId: chapterId!,
              chapterNumber: ch.attributes.chapter,
              coverFileName: coverFile,
              timestamp: Date.now(),
            });
          });

          // Get all chapters for navigation
          getMangaFeed(mangaRel.id, 0, 500).then(feedRes => {
            const sorted = feedRes.data.sort((a, b) => {
              const aNum = parseFloat(a.attributes.chapter || '0');
              const bNum = parseFloat(b.attributes.chapter || '0');
              return aNum - bNum;
            });
            setAllChapters(sorted);
            const idx = sorted.findIndex(c => c.id === chapterId);
            setCurrentChapterIndex(idx);
          });
        }
      })
      .catch(() => {});
  }, [chapterId]);

  // Save progress
  useEffect(() => {
    if (!chapterId || !mangaId || pages.length === 0) return;
    saveReadingProgress({
      mangaId,
      chapterId,
      page: currentPage,
      totalPages: pages.length,
      timestamp: Date.now(),
      mangaTitle,
    });
  }, [currentPage, chapterId, mangaId, mangaTitle, pages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') goNextPage();
      if (e.key === 'ArrowLeft' || e.key === 'a') goPrevPage();
      if (e.key === 'f') toggleFullscreen();
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, pages.length]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (settings.mode !== 'vertical') setShowControls(false);
    }, 3000);
  }, [settings.mode]);

  const goNextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1);
    } else if (currentChapterIndex < allChapters.length - 1) {
      // Go to next chapter
      navigate(`/read/${allChapters[currentChapterIndex + 1].id}`);
    }
  }, [currentPage, pages.length, currentChapterIndex, allChapters, navigate]);

  const goPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (currentChapterIndex > 0) {
      navigate(`/read/${allChapters[currentChapterIndex - 1].id}`);
    }
  }, [currentPage, currentChapterIndex, allChapters, navigate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveReaderSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full mx-auto mb-4" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="text-text-secondary text-sm">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-sm">
          <BookOpen size={40} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Failed to load chapter</h2>
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onMouseMove={resetControlsTimer}
      onClick={(e) => {
        if (settings.mode !== 'vertical') {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 3) goPrevPage();
          else if (x > (rect.width * 2) / 3) goNextPage();
          else setShowControls(!showControls);
        }
      }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-bg-tertiary">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
        />
      </div>

      {/* Top controls */}
      <div className={`absolute top-0 left-0 right-0 z-10 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(mangaId ? `/manga/${mangaId}` : -1 as any)} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{mangaTitle || 'Loading...'}</p>
              <p className="text-xs text-white/60">{chapterNum ? `Chapter ${chapterNum}` : ''} · Page {currentPage + 1}/{pages.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
              <Settings size={18} />
            </button>
            <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-14 right-4 z-30 w-64 bg-bg-secondary border border-border rounded-2xl shadow-card animate-scale-in">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            </div>

            {/* Reading mode */}
            <div>
              <p className="text-xs text-text-muted mb-2">Reading Mode</p>
              <div className="flex gap-1.5">
                {([
                  { mode: 'vertical' as ReadingMode, icon: AlignVerticalSpaceAround, label: 'Vertical' },
                  { mode: 'single' as ReadingMode, icon: FileText, label: 'Single' },
                  { mode: 'double' as ReadingMode, icon: Columns2, label: 'Double' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ mode })}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors ${
                      settings.mode === mode ? 'bg-accent/15 text-accent' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div>
              <p className="text-xs text-text-muted mb-2">Zoom: {settings.zoom}%</p>
              <div className="flex items-center gap-2">
                <button onClick={() => updateSettings({ zoom: Math.max(50, settings.zoom - 10) })} className="p-1.5 rounded-lg bg-bg-tertiary text-text-muted hover:text-text-primary">
                  <ZoomOut size={14} />
                </button>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={settings.zoom}
                  onChange={e => updateSettings({ zoom: parseInt(e.target.value) })}
                  className="flex-1 accent-accent"
                />
                <button onClick={() => updateSettings({ zoom: Math.min(200, settings.zoom + 10) })} className="p-1.5 rounded-lg bg-bg-tertiary text-text-muted hover:text-text-primary">
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* Brightness */}
            <div>
              <p className="text-xs text-text-muted mb-2">Brightness: {settings.brightness}%</p>
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-text-muted shrink-0" />
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={settings.brightness}
                  onChange={e => updateSettings({ brightness: parseInt(e.target.value) })}
                  className="flex-1 accent-accent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reader content */}
      <div className="flex-1 overflow-auto" style={{ filter: `brightness(${settings.brightness}%)` }}>
        {settings.mode === 'vertical' ? (
          /* Vertical scroll */
          <div className="flex flex-col items-center py-4 gap-1">
            {pages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Page ${i + 1}`}
                className="max-w-full"
                style={{ maxWidth: `${settings.zoom}%` }}
                loading={i < 5 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
                onLoad={() => {
                  // Track current page based on scroll position
                }}
              />
            ))}
          </div>
        ) : settings.mode === 'double' ? (
          /* Double page */
          <div className="h-full flex items-center justify-center gap-1 px-4">
            {[currentPage, currentPage + 1].map(pageIdx => (
              pageIdx < pages.length && (
                <img
                  key={pageIdx}
                  src={pages[pageIdx]}
                  alt={`Page ${pageIdx + 1}`}
                  className="max-h-full object-contain"
                  style={{ maxWidth: `${settings.zoom / 2}%` }}
                  referrerPolicy="no-referrer"
                />
              )
            ))}
          </div>
        ) : (
          /* Single page */
          <div className="h-full flex items-center justify-center px-4">
            <img
              src={pages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="max-h-full max-w-full object-contain"
              style={{ maxWidth: `${settings.zoom}%` }}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {settings.mode !== 'vertical' && (
        <div className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <div className="px-4 py-3 bg-gradient-to-t from-black/90 to-transparent">
            {/* Page slider */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-white/60 w-8 text-right">{currentPage + 1}</span>
              <input
                type="range"
                min="0"
                max={pages.length - 1}
                value={currentPage}
                onChange={e => setCurrentPage(parseInt(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="text-xs text-white/60 w-8">{pages.length}</span>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); goPrevPage(); }}
                disabled={currentPage === 0 && currentChapterIndex <= 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 text-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {/* Chapter nav */}
              <div className="flex items-center gap-2">
                {currentChapterIndex > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/read/${allChapters[currentChapterIndex - 1].id}`); }}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10"
                  >
                    ← Prev Chapter
                  </button>
                )}
                {currentChapterIndex < allChapters.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/read/${allChapters[currentChapterIndex + 1].id}`); }}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Next Chapter →
                  </button>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); goNextPage(); }}
                disabled={currentPage >= pages.length - 1 && currentChapterIndex >= allChapters.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 text-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side navigation arrows (single/double mode) */}
      {settings.mode !== 'vertical' && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrevPage(); }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/40 text-white/60 hover:text-white hover:bg-black/60 transition-all ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNextPage(); }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/40 text-white/60 hover:text-white hover:bg-black/60 transition-all ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            <ArrowRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}

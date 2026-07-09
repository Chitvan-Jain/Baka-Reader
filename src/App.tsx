import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MangaDetailPage from './pages/MangaDetailPage';
import ReaderPage from './pages/ReaderPage';
import LibraryPage from './pages/LibraryPage';
import SearchPage from './pages/SearchPage';
import ReadingListPage from './pages/ReadingListPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary manga-dots">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Reader is fullscreen, no layout */}
            <Route path="/read/:chapterId" element={<ReaderPage />} />

            {/* All other routes with layout */}
            <Route
              path="*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/manga/:id" element={<MangaDetailPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/lists" element={<ReadingListPage />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

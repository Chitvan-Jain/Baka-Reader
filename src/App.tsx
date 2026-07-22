import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { pullOnLogin, clearOnLogout } from './services/storage';
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
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** Syncs storage with Firestore when auth state changes */
function FirestoreSync() {
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (firebaseUser) {
      pullOnLogin(firebaseUser.uid).catch(err => {
        console.error('[FirestoreSync] Pull failed:', err);
      });
    } else {
      clearOnLogout();
    }
  }, [firebaseUser]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <FirestoreSync />
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
      </ThemeProvider>
    </BrowserRouter>
  );
}

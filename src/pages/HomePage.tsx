import FeaturedBanner from '../components/FeaturedBanner';
import RecentChapters from '../components/RecentChapters';
import TrendingCarousel from '../components/TrendingCarousel';
import PopularGenres from '../components/PopularGenres';
import Sidebar from '../components/Sidebar';

export default function HomePage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
      {/* Hero / Featured Banner */}
      <FeaturedBanner />

      {/* Trending Carousel */}
      <TrendingCarousel />

      {/* Popular Genres */}
      <PopularGenres />

      {/* Two-column layout */}
      <div className="mt-10 flex flex-col lg:flex-row gap-6">
        {/* Main Content — 70% */}
        <div className="flex-1 lg:w-[70%] min-w-0">
          <RecentChapters />
        </div>

        {/* Sidebar — 30% */}
        <div className="w-full lg:w-[30%] lg:max-w-sm">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

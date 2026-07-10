import FeaturedBanner from "../components/FeaturedBanner";
import RecentChapters from "../components/RecentChapters";
import TrendingCarousel from "../components/TrendingCarousel";
import PopularGenres from "../components/PopularGenres";
import Sidebar from "../components/Sidebar";

export default function HomePage() {
	return (
		<div className="flex justify-center">
			<div className=" max-w-5/6 mx-auto px-4 py-6">
				{/* Hero / Featured Banner */}
				<FeaturedBanner />

				{/* Trending Carousel */}
				<TrendingCarousel />

				{/* Popular Genres */}
				<PopularGenres />

				{/* Two-column layout */}
				<div className="mt-10 flex flex-col lg:flex-row gap-6">
					{/* Main Content — 70% */}
					<div className="flex-1 min-w-0">
						<RecentChapters />
					</div>

					{/* Sidebar — 30% */}
					<div className="w-full lg:w-85 shrink-0">
						<Sidebar />
					</div>
				</div>
			</div>
		</div>
	);
}

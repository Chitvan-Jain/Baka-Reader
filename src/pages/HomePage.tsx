import FeaturedBanner from "../components/FeaturedBanner";
import RecentChapters from "../components/RecentChapters";
import TrendingCarousel from "../components/TrendingCarousel";
import PopularGenres from "../components/PopularGenres";
import Sidebar from "../components/Sidebar";

export default function HomePage() {
	return (
		<div className="site-container py-6">
			<FeaturedBanner />
			<TrendingCarousel />
			<PopularGenres />

			<div className="mt-10 flex flex-col lg:flex-row gap-8">
				<div className="flex-1 min-w-0">
					<RecentChapters />
				</div>
				<div className="w-full lg:w-[320px] shrink-0">
					<Sidebar />
				</div>
			</div>
		</div>
	);
}

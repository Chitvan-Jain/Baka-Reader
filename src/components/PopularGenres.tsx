import { Link } from 'react-router-dom';
import { Swords, Heart, Laugh, Ghost, Sparkles, Flame, Brain, Globe, Wand2, Users, Zap, Skull } from 'lucide-react';

const genres = [
  { name: 'Action', icon: Swords, gradient: 'from-red-500/20 to-orange-500/20', borderColor: 'border-red-500/30', tag: '391b0423-d847-456f-aff0-8b0cfc03066b' },
  { name: 'Romance', icon: Heart, gradient: 'from-pink-500/20 to-rose-500/20', borderColor: 'border-pink-500/30', tag: '423e2eae-a7a2-4a8b-ac03-a8351462d71d' },
  { name: 'Comedy', icon: Laugh, gradient: 'from-yellow-500/20 to-amber-500/20', borderColor: 'border-yellow-500/30', tag: '4d32cc48-9f00-4cca-9b5a-a839f0764984' },
  { name: 'Horror', icon: Ghost, gradient: 'from-purple-500/20 to-violet-500/20', borderColor: 'border-purple-500/30', tag: 'cdad7e68-1419-41dd-bdce-27753074a640' },
  { name: 'Fantasy', icon: Sparkles, gradient: 'from-indigo-500/20 to-blue-500/20', borderColor: 'border-indigo-500/30', tag: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc' },
  { name: 'Drama', icon: Flame, gradient: 'from-orange-500/20 to-red-500/20', borderColor: 'border-orange-500/30', tag: 'b9af3a63-f058-46de-a9a0-e0c13906197a' },
  { name: 'Psychological', icon: Brain, gradient: 'from-teal-500/20 to-cyan-500/20', borderColor: 'border-teal-500/30', tag: '3b60b75c-a2d7-4860-ab56-05f391bb889c' },
  { name: 'Isekai', icon: Globe, gradient: 'from-emerald-500/20 to-green-500/20', borderColor: 'border-emerald-500/30', tag: 'ace04997-f6bd-436e-b261-779182193d3d' },
  { name: 'Magic', icon: Wand2, gradient: 'from-fuchsia-500/20 to-pink-500/20', borderColor: 'border-fuchsia-500/30', tag: 'a1f53773-c69a-4ce5-8cab-fffcd90b1565' },
  { name: 'Slice of Life', icon: Users, gradient: 'from-sky-500/20 to-blue-500/20', borderColor: 'border-sky-500/30', tag: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9' },
  { name: 'Sci-Fi', icon: Zap, gradient: 'from-cyan-500/20 to-teal-500/20', borderColor: 'border-cyan-500/30', tag: '256c8bd9-4904-4f7b-a3a0-b7f5e11f5b0c' },
  { name: 'Thriller', icon: Skull, gradient: 'from-gray-500/20 to-zinc-500/20', borderColor: 'border-gray-500/30', tag: 'ee968100-4191-4968-93d3-f82d72be7e46' },
];

export default function PopularGenres() {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-text-primary mb-5">Popular Genres</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {genres.map(genre => {
          const Icon = genre.icon;
          return (
            <Link
              key={genre.name}
              to={`/search?tags=${genre.tag}`}
              className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${genre.gradient} border ${genre.borderColor} hover:scale-105 transition-all duration-300 hover:shadow-card`}
            >
              <Icon size={24} className="text-text-primary group-hover:text-accent transition-colors" />
              <span className="text-xs font-semibold text-text-primary">{genre.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

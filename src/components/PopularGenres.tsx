import { Link } from 'react-router-dom';
import { Swords, Heart, Laugh, Ghost, Sparkles, Flame, Brain, Globe, Wand2, Users, Zap, Skull } from 'lucide-react';

const genres = [
  { name: 'Action', icon: Swords, tag: '391b0423-d847-456f-aff0-8b0cfc03066b' },
  { name: 'Romance', icon: Heart, tag: '423e2eae-a7a2-4a8b-ac03-a8351462d71d' },
  { name: 'Comedy', icon: Laugh, tag: '4d32cc48-9f00-4cca-9b5a-a839f0764984' },
  { name: 'Horror', icon: Ghost, tag: 'cdad7e68-1419-41dd-bdce-27753074a640' },
  { name: 'Fantasy', icon: Sparkles, tag: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc' },
  { name: 'Drama', icon: Flame, tag: 'b9af3a63-f058-46de-a9a0-e0c13906197a' },
  { name: 'Psychological', icon: Brain, tag: '3b60b75c-a2d7-4860-ab56-05f391bb889c' },
  { name: 'Isekai', icon: Globe, tag: 'ace04997-f6bd-436e-b261-779182193d3d' },
  { name: 'Magic', icon: Wand2, tag: 'a1f53773-c69a-4ce5-8cab-fffcd90b1565' },
  { name: 'Slice of Life', icon: Users, tag: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9' },
  { name: 'Sci-Fi', icon: Zap, tag: '256c8bd9-4904-4f7b-a3a0-b7f5e11f5b0c' },
  { name: 'Thriller', icon: Skull, tag: 'ee968100-4191-4968-93d3-f82d72be7e46' },
];

export default function PopularGenres() {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-text-primary mb-4">Genres</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {genres.map(genre => {
          const Icon = genre.icon;
          return (
            <Link
              key={genre.name}
              to={`/search?tags=${genre.tag}`}
              className="group flex flex-col items-center gap-1.5 p-3 rounded-lg bg-bg-secondary border border-border hover:border-accent/30 hover:bg-bg-tertiary transition-colors"
            >
              <Icon size={20} className="text-text-secondary group-hover:text-accent transition-colors" />
              <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{genre.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

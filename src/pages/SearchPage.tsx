import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, Gamepad2, ChevronRight, Star } from 'lucide-react';
import { searchGamesGemini, getRecommendedGamesGemini, GameResult } from '../services/geminiService';
import { cn } from '../lib/utils';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('cat') || '';
  
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Derived filtered results
  const filteredResults = results.filter(game => {
    if (selectedPlatforms.length === 0) return true;
    
    // Check if any of the game's platforms match the selected platforms
    return game.platforms?.some(p => 
      selectedPlatforms.some(sp => p.toLowerCase().includes(sp.toLowerCase()))
    );
  });

  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      try {
        if (query) {
          const res = await searchGamesGemini(query);
          setResults(res);
        } else if (category) {
          const res = await getRecommendedGamesGemini(category);
          setResults(res);
        } else {
          const res = await getRecommendedGamesGemini();
          setResults(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    performSearch();
  }, [query, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {query ? `Busca: "${query}"` : category ? `Categoria: ${category}` : 'Explorar Jogos'}
          </h1>
          <p className="text-slate-400 mt-2">Descubra novos títulos e aventuras na biblioteca do Gameboxd.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pesquisar um jogo..." 
            className="w-full h-12 bg-[#161927] border border-[#1E2135] rounded-xl px-12 focus:outline-none focus:border-[#8B5CF6] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#8B5CF6] transition-colors" />
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        {/* Sidebar Filters */}
        <aside className="space-y-8 hidden lg:block">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Categorias</h3>
            <div className="space-y-1">
              {['Ação', 'RPG', 'Terror', 'Aventura', 'Esportes', 'Indie', 'Estratégia'].map((c) => (
                <button 
                  key={c}
                  onClick={() => setSearchParams({ cat: c })}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                    category === c ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "text-slate-400 hover:text-slate-200 hover:bg-[#161927]"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Plataformas</h3>
            <div className="space-y-2">
              {[
                { id: 'pc', label: 'PC' },
                { id: 'playstation', label: 'PlayStation 5' },
                { id: 'xbox', label: 'Xbox Series X/S' },
                { id: 'switch', label: 'Nintendo Switch' }
              ].map((p) => (
                <label key={p.id} className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={selectedPlatforms.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, p.id]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(id => id !== p.id));
                        }
                      }}
                      className="peer h-5 w-5 bg-slate-800 border border-slate-700 rounded transition-all checked:bg-[#8B5CF6] checked:border-[#8B5CF6] appearance-none"
                    />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white transition-opacity pointer-events-none">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    selectedPlatforms.includes(p.id) ? "text-slate-100" : "text-slate-400 group-hover:text-slate-200"
                  )}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          { (category || selectedPlatforms.length > 0) && (
            <button 
              onClick={() => {
                setSearchParams({});
                setSelectedPlatforms([]);
              }}
              className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6] transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </aside>

        {/* Main Grid */}
        <div className="space-y-8">
           {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
               {Array(8).fill(0).map((_, i) => (
                 <div key={i} className="space-y-3">
                   <div className="aspect-[3/4] bg-[#161927] rounded-2xl animate-pulse border border-[#1E2135]" />
                   <div className="h-4 bg-[#161927] rounded w-3/4 animate-pulse" />
                 </div>
               ))}
             </div>
           ) : filteredResults.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
               {filteredResults.map((game, i) => (
                 <GameResultCard key={i} game={game} index={i} />
               ))}
             </div>
           ) : (
             <div className="py-24 text-center space-y-4 border-2 border-dashed border-[#1E2135] rounded-3xl">
               <div className="inline-flex p-4 bg-[#161927] rounded-2xl border border-[#1E2135]">
                 <Search className="w-8 h-8 text-slate-500" />
               </div>
               <h3 className="text-xl font-bold">Nenhum jogo encontrado</h3>
               <p className="text-slate-400">Tente ajustar sua pesquisa ou explore as categorias.</p>
               <button 
                onClick={() => setSearchParams({})}
                className="text-[#8B5CF6] font-medium hover:underline"
               >
                 Limpar filtros
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function GameResultCard({ game, index }: { game: GameResult, index: number, key?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="group"
    >
      <Link to={`/game/${encodeURIComponent(game.title)}`} className="block relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#161927] border border-[#1E2135] shadow-xl shadow-black/20">
        <img 
          src={game.coverUrl} 
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15] via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
          <div className="flex items-center gap-1 text-yellow-400 mb-1">
             <Star className="w-3 h-3 fill-current" />
             <span className="text-xs font-bold">4.5</span>
          </div>
          <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">{game.description}</p>
        </div>
      </Link>
      <div className="mt-4 px-1">
        <h3 className="font-bold text-sm leading-tight truncate group-hover:text-[#8B5CF6] transition-colors">{game.title}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{game.categories?.[0] || 'Game'}</span>
          <span className="text-[10px] font-medium text-slate-400">{game.releaseDate?.match(/\d{4}/)?.[0] || game.releaseDate}</span>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Clock, LayoutGrid, Search, ChevronRight, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecommendedGamesGemini, GameResult } from '../services/geminiService';
import { cn } from '../lib/utils';
import { seedInitialData } from '../lib/seed';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Home() {
  const [trendingGames, setTrendingGames] = useState<GameResult[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        await seedInitialData();
        const top = await getRecommendedGamesGemini();
        setTrendingGames(top.slice(0, 6));
        
        const q = query(collection(db, 'reviews'), limit(3), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setRecentReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = [
    { name: 'RPG', color: 'from-orange-500 to-red-500' },
    { name: 'Ação', color: 'from-blue-500 to-indigo-500' },
    { name: 'Terror', color: 'from-zinc-800 to-slate-900' },
    { name: 'Mundo Aberto', color: 'from-green-500 to-emerald-500' },
    { name: 'Indie', color: 'from-purple-500 to-pink-500' },
    { name: 'FPS', color: 'from-red-600 to-orange-600' }
  ];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#161927] border border-[#1E2135] p-8 md:p-16">
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]"
          >
            Faça a sua <span className="text-[#8B5CF6]">review.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Compartilhe sua opinião sobre os jogos que você zerou, ajude a comunidade e registre sua jornada gamer com detalhes técnicos.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row gap-4"
          >
            <motion.button 
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/create-review')}
              className="px-10 h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-bold shadow-2xl shadow-[#8B5CF6]/30 transition-all flex items-center justify-center gap-3 text-lg group"
            >
              Criar Review Agora
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>

        {/* Featured Game Background Overlay */}
        {trendingGames[0] && (
          <div className="absolute right-0 top-0 w-full md:w-3/4 h-full z-0 overflow-hidden opacity-30 pointer-events-none">
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              src={trendingGames[0].coverUrl} 
              className="w-full h-full object-cover grayscale-[0.8] blur-[2px]"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#161927] via-[#161927]/60 to-transparent" />
          </div>
        )}

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8B5CF6]/20 blur-[120px] -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#3B82F6]/10 blur-[80px] translate-y-1/4" />
      </section>

      {/* Trending Tiles */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B5CF6]/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Lançamentos & Tendências</h2>
          </div>
          <Link to="/search" className="text-sm font-medium text-[#8B5CF6] hover:underline flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {loading ? Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#161927] rounded-xl animate-pulse border border-[#1E2135]" />
          )) : trendingGames.map((game, i) => (
            <GameCard key={i} game={game} index={i} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Categorias Populares</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/search?cat=${cat.name}`}
              className={cn(
                "relative h-24 overflow-hidden rounded-2xl group transition-transform hover:-translate-y-1",
                "bg-gradient-to-br", cat.color
              )}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
              <span className="absolute bottom-3 left-4 font-bold text-white tracking-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Atividade Recente</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-[#161927] rounded-2xl border border-[#1E2135] animate-pulse" />
          )) : recentReviews.map((review, i) => (
            <RealReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}

function GameCard({ game, index }: { game: GameResult, index: number, key?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group relative h-full flex flex-col"
    >
      <Link to={`/game/${encodeURIComponent(game.title)}`} className="block relative aspect-[3/4] overflow-hidden rounded-xl bg-[#161927] border border-[#1E2135]">
        <img 
          src={game.coverUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'} 
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15] via-transparent opacity-0 group-hover:opacity-60 transition-opacity" />
      </Link>
      <div className="mt-3">
        <h3 className="font-bold text-sm truncate group-hover:text-[#8B5CF6] transition-colors">{game.title}</h3>
        <p className="text-xs text-slate-500 mt-1">{game.releaseDate?.match(/\d{4}/)?.[0] || 'N/A'}</p>
      </div>
    </motion.div>
  );
}

function RealReviewCard({ review }: { review: any, key?: any }) {
  return (
    <div className="p-4 bg-[#161927] border border-[#1E2135] rounded-2xl flex gap-4 items-start group hover:border-[#8B5CF6]/30 transition-colors">
      <Link to={`/game/${encodeURIComponent(review.gameTitle)}#review-${review.id}`} className="w-16 h-24 flex-shrink-0 bg-[#0B0C15] rounded-lg overflow-hidden border border-[#1E2135]">
        <img src={review.gameCoverUrl} className="w-full h-full object-cover" alt="" />
      </Link>
      <div className="space-y-1 flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <img 
            src={review.userPhotoURL} 
            className="w-5 h-5 rounded-full" 
            alt={review.userDisplayName}
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{review.userDisplayName}</span>
        </div>
        <Link to={`/game/${encodeURIComponent(review.gameTitle)}#review-${review.id}`} className="block">
          <h4 className="font-bold text-sm text-slate-100 truncate group-hover:text-[#8B5CF6] transition-colors">{review.gameTitle}</h4>
        </Link>
        <div className="flex gap-0.5 py-0.5">
          {Array(5).fill(0).map((_, i) => (
             <Star key={i} className={cn("w-2.5 h-2.5", review.rating > i ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-slate-700")} />
          ))}
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 italic leading-relaxed">"{review.content}"</p>
      </div>
    </div>
  )
}

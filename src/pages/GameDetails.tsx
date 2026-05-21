import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  MessageSquare, 
  Monitor, 
  Heart, 
  Share2, 
  Clock, 
  ChevronRight,
  Cpu,
  Zap,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Filter,
  Search,
  Smartphone,
  Info,
  X as XIcon,
  Edit3,
  Trash2
} from 'lucide-react';
import { searchGamesGemini, GameResult } from '../services/geminiService';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { cn } from '../lib/utils';

interface UserReview {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  rating: number;
  content: string;
  pcSpecs?: {
    cpu: string;
    gpu: string;
    ram: string;
  };
  createdAt: any;
  likesCount: number;
}

export default function GameDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [game, setGame] = useState<GameResult | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Filtering state
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterSpecs, setFilterSpecs] = useState<string>('');

  useEffect(() => {
    async function checkFavorite() {
      if (!auth.currentUser || !id) return;
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const favs = userDoc.data().favoriteGames || [];
        const gameId = decodeURIComponent(id);
        const exists = favs.some((f: any) => {
          if (typeof f === 'string') return f === gameId;
          return f?.title === gameId;
        });
        setIsFavorite(exists);
      }
    }
    if (game) checkFavorite();
  }, [id, game]);

  const toggleFavorite = async () => {
    if (!auth.currentUser || !game || !id) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const favs = data.favoriteGames || [];
      const gameId = decodeURIComponent(id);
      
      const exists = favs.some((f: any) => {
        if (typeof f === 'string') return f === gameId;
        return f?.title === gameId;
      });

      let newFavs;
      if (exists) {
        newFavs = favs.filter((f: any) => {
          if (typeof f === 'string') return f !== gameId;
          return f?.title !== gameId;
        });
      } else {
        newFavs = [...favs, { title: gameId, coverUrl: game.coverUrl }];
      }
      await updateDoc(userRef, { favoriteGames: newFavs });
      setIsFavorite(!exists);
    }
  };
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [includeSpecs, setIncludeSpecs] = useState(false);
  const [specs, setSpecs] = useState({ cpu: '', gpu: '', ram: '' });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingReview, setEditingReview] = useState<UserReview | null>(null);

  const handleOpenNewReview = () => {
    if (!auth.currentUser) return alert("Faça login para avaliar");
    setEditingReview(null);
    setRating(5);
    setContent('');
    setIncludeSpecs(false);
    setSpecs({ cpu: '', gpu: '', ram: '' });
    setShowReviewForm(true);
  };

  const handleStartEdit = (rev: UserReview) => {
    setEditingReview(rev);
    setRating(rev.rating);
    setContent(rev.content);
    setIncludeSpecs(!!rev.pcSpecs);
    setSpecs(rev.pcSpecs || { cpu: '', gpu: '', ram: '' });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Você tem certeza que deseja excluir esta review?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Erro ao deletar review:", error);
      alert("Não foi possível excluir a review.");
    }
  };

  // Derived filtered reviews
  const filteredReviews = reviews.filter(review => {
    // Rating filter
    if (filterRating !== 'all') {
      if (filterRating === '5' && review.rating !== 5) return false;
      if (filterRating === '3-4' && (review.rating < 3 || review.rating > 4)) return false;
      if (filterRating === '1-2' && review.rating > 2) return false;
    }

    // Specs filter
    if (filterSpecs.trim()) {
      if (!review.pcSpecs) return false;
      const search = filterSpecs.toLowerCase();
      const hasMatch = 
        review.pcSpecs.cpu.toLowerCase().includes(search) || 
        review.pcSpecs.gpu.toLowerCase().includes(search) || 
        review.pcSpecs.ram.toLowerCase().includes(search);
      if (!hasMatch) return false;
    }

    return true;
  });

  useEffect(() => {
    async function loadGameData() {
      if (!id) return;
      setLoading(true);
      try {
        const results = await searchGamesGemini(id);
        const exact = results.find(g => g.title.toLowerCase() === decodeURIComponent(id).toLowerCase()) || results[0];
        setGame(exact);

        // Load Reviews from Firestore
        const q = query(
          collection(db, 'reviews'), 
          where('gameTitle', '==', exact.title),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const revs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReview));
        setReviews(revs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadGameData();
  }, [id]);

  useEffect(() => {
    if (!loading && reviews.length > 0 && location.hash) {
      const reviewId = location.hash.replace('#', '');
      const element = document.getElementById(reviewId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect
          element.classList.add('ring-2', 'ring-[#8B5CF6]', 'ring-offset-4', 'ring-offset-[#0B0C15]');
          setTimeout(() => element.classList.remove('ring-2', 'ring-[#8B5CF6]', 'ring-offset-4', 'ring-offset-[#0B0C15]'), 3000);
        }, 100);
      }
    }
  }, [loading, reviews, location.hash]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !game) return;

    setSubmitting(true);
    const path = 'reviews';
    try {
      if (editingReview) {
        const reviewRef = doc(db, 'reviews', editingReview.id);
        const updateData: any = {
          rating,
          content,
          pcSpecs: includeSpecs ? specs : null
        };
        await updateDoc(reviewRef, updateData);

        // Update local state
        setReviews(reviews.map(r => r.id === editingReview.id ? { 
          ...r, 
          rating, 
          content, 
          pcSpecs: includeSpecs ? specs : undefined 
        } : r));
        setEditingReview(null);
      } else {
        const reviewData = {
          gameId: id,
          gameTitle: game.title,
          gameCoverUrl: game.coverUrl,
          userId: auth.currentUser.uid,
          userDisplayName: auth.currentUser.displayName || 'Anon',
          userPhotoURL: auth.currentUser.photoURL || '',
          rating,
          content,
          createdAt: serverTimestamp(),
          likesCount: 0,
          ...(includeSpecs ? { pcSpecs: specs } : {})
        };

        const docRef = await addDoc(collection(db, path), reviewData);
        
        const newReview: UserReview = {
          id: docRef.id,
          ...reviewData,
          createdAt: { toDate: () => new Date() } // Local optimistic update
        };
        
        setReviews([newReview, ...reviews]);
      }
      
      setShowReviewForm(false);
      setContent('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-12 animate-pulse">
        <div className="h-[400px] bg-[#161927] rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12">
          <div className="space-y-6">
            <div className="h-8 bg-[#161927] rounded w-1/2" />
            <div className="h-24 bg-[#161927] rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!game) return <div>Jogo não encontrado.</div>;

  return (
    <div className="space-y-12">
      {/* Header / Banner */}
      <section className="relative h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden border border-[#1E2135]">
        <img 
          src={game.coverUrl} 
          className="w-full h-full object-cover grayscale-[0.2]" 
          alt={game.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15] via-[#0B0C15]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col md:flex-row items-end gap-8">
           <div className="w-48 h-72 hidden md:block rounded-2xl overflow-hidden border-4 border-[#0B0C15] shadow-2xl shadow-black">
              <img src={game.coverUrl} className="w-full h-full object-cover" alt="" />
           </div>
           <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                 {game.categories.map(c => (
                   <span key={c} className="px-3 py-1 bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-bold rounded-full">
                     {c}
                   </span>
                 ))}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic">{game.title}</h1>
              <div className="flex items-center gap-6 text-slate-300">
                 <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xl font-bold">4.8</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{game.releaseDate?.match(/\d{4}/)?.[0] || game.releaseDate}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{reviews.length} Reviews</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFavorite}
                className={cn(
                  "p-4 border rounded-2xl transition-all duration-300 relative overflow-hidden group",
                  isFavorite 
                   ? "bg-pink-500/20 border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.3)]" 
                   : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <Heart className={cn(
                  "w-6 h-6 transition-transform duration-300", 
                  isFavorite ? "text-pink-500 fill-current scale-110" : "text-slate-400 group-hover:text-pink-400"
                )} />
                {isFavorite && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute inset-0 bg-pink-500/20 rounded-full"
                  />
                )}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenNewReview}
                className="px-8 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-bold shadow-xl shadow-[#8B5CF6]/30 transition-all"
              >
                Avaliar Jogo
              </motion.button>
           </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
        <div className="space-y-12">
          {/* About */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-2 h-8 bg-[#8B5CF6] rounded-full" />
              Sobre o Jogo
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">{game.description}</p>
            <div className="grid grid-cols-2 gap-8 py-6 border-y border-[#1E2135]">
               <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Desenvolvedora</h4>
                  <p className="font-medium">{game.developer}</p>
               </div>
               <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Distribuidora</h4>
                  <p className="font-medium">{game.publisher}</p>
               </div>
            </div>
          </section>

          {/* Reviews List */}
          <section className="space-y-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Reviews da Comunidade</h2>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  Total: <span className="text-[#8B5CF6]">{filteredReviews.length}</span>
                </div>
              </div>

              {/* Filter UI */}
              <div className="p-6 bg-[#161927] border border-[#1E2135] rounded-3xl space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-[#8B5CF6]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Filtrar Experiências</h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Rating Filter Buttons */}
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avaliação</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'Todas' },
                        { id: '5', label: '5 Estrelas' },
                        { id: '3-4', label: '3-4 Estrelas' },
                        { id: '1-2', label: '1-2 Estrelas' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFilterRating(f.id)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                            filterRating === f.id 
                              ? "bg-[#8B5CF6] border-[#8B5CF6] text-white" 
                              : "bg-[#0B0C15] border-[#1E2135] text-slate-400 hover:border-[#8B5CF6]/50"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specs Search */}
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hardware (Specs)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Ex: RTX 3080, i7, 16GB..."
                        value={filterSpecs}
                        onChange={(e) => setFilterSpecs(e.target.value)}
                        className="w-full bg-[#0B0C15] border border-[#1E2135] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#8B5CF6] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {(filterRating !== 'all' || filterSpecs) && (
                  <button 
                    onClick={() => { setFilterRating('all'); setFilterSpecs(''); }}
                    className="text-[10px] font-bold text-[#8B5CF6] hover:underline uppercase tracking-widest"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {filteredReviews.length > 0 ? filteredReviews.map((rev) => (
                <ReviewCard 
                  key={rev.id} 
                  review={rev} 
                  onEdit={handleStartEdit} 
                  onDelete={handleDeleteReview} 
                />
              )) : (
                <div className="py-16 text-center bg-[#161927] rounded-3xl border border-[#1E2135] border-dashed">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">Nenhuma review encontrada</h3>
                  <p className="text-slate-500 text-sm">Tente ajustar seus filtros de busca.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
           <div className="p-6 bg-[#161927] border border-[#1E2135] rounded-3xl space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-[#8B5CF6]" />
                Plataformas Disponíveis
              </h3>
              <div className="flex flex-col gap-3">
                 {game.platforms && game.platforms.length > 0 ? game.platforms.map(platform => {
                   const isPC = platform.toLowerCase().includes('pc');
                   const isPlayStation = platform.toLowerCase().includes('playstation') || platform.toLowerCase().includes('ps');
                   const isXbox = platform.toLowerCase().includes('xbox');
                   const isSwitch = platform.toLowerCase().includes('switch') || platform.toLowerCase().includes('nintendo');

                   return (
                     <div key={platform} className="flex items-center justify-between p-3 bg-[#0B0C15] rounded-xl border border-[#1E2135]/50 hover:border-[#8B5CF6]/30 transition-colors">
                        <div className="flex items-center gap-3">
                           {isPC && <Monitor className="w-5 h-5 text-blue-400" />}
                           {isPlayStation && <Gamepad2 className="w-5 h-5 text-indigo-400" />}
                           {isXbox && <Gamepad2 className="w-5 h-5 text-green-400" />}
                           {isSwitch && <Smartphone className="w-5 h-5 text-red-500" />}
                           {!isPC && !isPlayStation && !isXbox && !isSwitch && <Gamepad2 className="w-5 h-5 text-slate-400" />}
                           <span className="text-sm font-bold tracking-tight">{platform}</span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                     </div>
                   );
                 }) : (
                   <div className="p-4 bg-[#0B0C15] rounded-xl text-center">
                     <p className="text-xs text-slate-500 italic">Informações de plataforma não disponíveis.</p>
                   </div>
                 )}
              </div>
           </div>
        </aside>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowReviewForm(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-[#161927] border border-[#1E2135] rounded-3xl overflow-hidden shadow-2xl"
            >
               <div className="p-6 border-b border-[#1E2135] flex items-center justify-between">
                  <h2 className="text-xl font-bold">{editingReview ? "Editar Review" : "Escrever Review"}: {game.title}</h2>
                  <button onClick={() => setShowReviewForm(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                    <XIcon className="w-6 h-6" />
                  </button>
               </div>
               
               <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                  <div className="flex flex-col items-center gap-4 py-4 bg-[#0B0C15]/50 rounded-2xl">
                     <span className="text-xs font-bold uppercase text-slate-500 letter tracking-widest">Sua nota</span>
                     <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button 
                            key={s} 
                            type="button"
                            onClick={() => setRating(s)}
                            className="transition-transform active:scale-90"
                          >
                            <Star className={cn("w-10 h-10", rating >= s ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-slate-700")} />
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold uppercase text-slate-500">O que você achou do jogo?</label>
                     <textarea 
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Sem spoilers se possível..."
                        className="w-full h-40 bg-[#0B0C15] border border-[#1E2135] rounded-2xl p-4 focus:outline-none focus:border-[#8B5CF6] transition-all"
                     />
                  </div>

                  <div className="p-6 bg-[#0B0C15]/50 border border-[#1E2135] rounded-3xl space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Monitor className="w-5 h-5 text-blue-400" />
                           <h3 className="text-sm font-bold uppercase tracking-wider">Configuração de PC</h3>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIncludeSpecs(!includeSpecs)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                            includeSpecs ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          )}
                        >
                          {includeSpecs ? 'Remover' : 'Adicionar'}
                        </button>
                     </div>

                     {includeSpecs ? (
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                       >
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 text-slate-500">
                                <Cpu className="w-3 h-3" />
                                <label className="text-[10px] font-bold uppercase">Processador (CPU)</label>
                             </div>
                             <input value={specs.cpu} onChange={e => setSpecs({...specs, cpu: e.target.value})} className="w-full bg-[#0B0C15] border border-[#1E2135] rounded-xl p-3 text-sm focus:border-blue-500/50 outline-none transition-colors" placeholder="Ex: Ryzen 7 5800X" />
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 text-slate-500">
                                <Zap className="w-3 h-3" />
                                <label className="text-[10px] font-bold uppercase">Placa de Vídeo (GPU)</label>
                             </div>
                             <input value={specs.gpu} onChange={e => setSpecs({...specs, gpu: e.target.value})} className="w-full bg-[#0B0C15] border border-[#1E2135] rounded-xl p-3 text-sm focus:border-blue-500/50 outline-none transition-colors" placeholder="Ex: RTX 3070 Ti" />
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 text-slate-500">
                                <HardDrive className="w-3 h-3" />
                                <label className="text-[10px] font-bold uppercase">Memória (RAM)</label>
                             </div>
                             <input value={specs.ram} onChange={e => setSpecs({...specs, ram: e.target.value})} className="w-full bg-[#0B0C15] border border-[#1E2135] rounded-xl p-3 text-sm focus:border-blue-500/50 outline-none transition-colors" placeholder="Ex: 32GB DDR4" />
                          </div>
                       </motion.div>
                     ) : (
                       <p className="text-xs text-slate-500 italic">Compartilhe o setup onde você jogou para ajudar outros jogadores.</p>
                     )}
                  </div>

                  <motion.button 
                    disabled={submitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-[#8B5CF6]/30 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Enviando...
                      </>
                    ) : (
                      editingReview ? 'Salvar Alterações' : 'Publicar Review'
                    )}
                  </motion.button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {saved && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 z-[200] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
        >
          <CheckCircle2 className="w-5 h-5" />
          Review publicada com sucesso!
        </motion.div>
      )}
    </div>
  );
}

function ReviewCard({ 
  review, 
  onEdit, 
  onDelete 
}: { 
  review: UserReview; 
  onEdit?: (review: UserReview) => void; 
  onDelete?: (reviewId: string) => void;
  key?: any;
}) {
  const isOwnReview = auth.currentUser?.uid === review.userId;

  return (
    <motion.div 
      id={`review-${review.id}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 bg-[#161927] border border-[#1E2135] rounded-[2rem] space-y-4 transition-all duration-500"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={review.userPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`} 
            className="w-10 h-10 rounded-full border border-[#1E2135]" 
            alt="" 
          />
          <div>
            <h4 className="font-bold text-slate-200">{review.userDisplayName}</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {review.createdAt?.toDate?.()?.toLocaleDateString() || 'Recentemente'}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array(5).fill(0).map((_, i) => (
             <Star key={i} className={cn("w-4 h-4", review.rating > i ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-slate-700")} />
          ))}
        </div>
      </div>

      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{review.content}</p>

      {review.pcSpecs && (
        <div className="p-4 bg-[#0B0C15] rounded-2xl border border-[#1E2135] flex flex-wrap gap-6">
           <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                 <span className="text-[8px] uppercase font-black text-slate-600">CPU</span>
                 <span className="text-xs font-bold text-slate-300">{review.pcSpecs.cpu}</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                 <span className="text-[8px] uppercase font-black text-slate-600">GPU</span>
                 <span className="text-xs font-bold text-slate-300">{review.pcSpecs.gpu}</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                 <span className="text-[8px] uppercase font-black text-slate-600">RAM</span>
                 <span className="text-xs font-bold text-slate-300">{review.pcSpecs.ram}</span>
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: -15 }}
            className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors group"
          >
            <Heart className="w-4 h-4 group-hover:fill-current" />
            <span className="text-xs font-bold">{review.likesCount}</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 text-slate-400 hover:text-[#8B5CF6] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold">Responder</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>

        {isOwnReview && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(review)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </motion.button>
            )}
            {onDelete && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(review.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-500 text-xs font-bold rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

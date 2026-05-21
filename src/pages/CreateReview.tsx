import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Star, Monitor, Smartphone, Gamepad2, Send, Cpu, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchGamesGemini, GameResult } from '../services/geminiService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function CreateReview() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('');
  const [hardware, setHardware] = useState({ cpu: '', gpu: '', ram: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchGamesGemini(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectGame = (game: GameResult) => {
    setSelectedGame(game);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert('Você precisa estar logado para publicar uma review.');
    if (rating === 0) return alert('Por favor, dê uma nota para o jogo.');
    if (!platform) return alert('Por favor, selecione a plataforma.');

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        gameTitle: selectedGame?.title,
        gameCoverUrl: selectedGame?.coverUrl,
        rating,
        content,
        platform,
        hardware: platform === 'PC' ? hardware : null,
        userId: auth.currentUser.uid,
        userDisplayName: auth.currentUser.displayName || 'Gamer Anonimo',
        userPhotoURL: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
        createdAt: serverTimestamp(),
      });
      navigate('/');
    } catch (error) {
      console.error("Erro ao salvar review:", error);
      alert('Ocorreu um erro ao salvar sua review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Qual jogo você quer avaliar?</h1>
              <p className="text-slate-400">Pesquise o nome do jogo que você zerou ou está jogando.</p>
              
              <div className="relative group max-w-xl">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: Elden Ring, God of War..." 
                  className="w-full h-14 bg-[#161927] border border-[#1E2135] rounded-2xl px-12 focus:outline-none focus:border-[#8B5CF6] transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#8B5CF6] transition-colors" />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#8B5CF6] text-white rounded-xl font-bold text-sm hover:bg-[#7C3AED] disabled:opacity-50 transition-colors"
                >
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResults.map((game, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => selectGame(game)}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#161927] border border-[#1E2135] group-hover:border-[#8B5CF6]/50 transition-colors">
                    <img src={game.coverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={game.title} />
                  </div>
                  <h3 className="font-bold text-sm truncate group-hover:text-[#8B5CF6] transition-colors">{game.title}</h3>
                </motion.div>
              ))}
            </div>
            
            {searchResults.length === 0 && !isSearching && searchQuery && (
              <div className="text-center py-20 border-2 border-dashed border-[#1E2135] rounded-3xl">
                <p className="text-slate-500">Nenhum resultado encontrado. Tente buscar por termos mais simples.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar para busca
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#1E2135] shadow-2xl">
                  <img src={selectedGame?.coverUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <h2 className="text-xl font-bold text-center tracking-tight">{selectedGame?.title}</h2>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sua Nota</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star className={cn(
                          "w-10 h-10 transition-colors",
                          rating >= star ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-[#1E2135] hover:text-[#3B4264]"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">O que você achou?</label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    placeholder="Conte sua experiência, o que mais gostou e o que não gostou..."
                    className="w-full h-40 bg-[#161927] border border-[#1E2135] rounded-2xl p-6 focus:outline-none focus:border-[#8B5CF6] transition-all resize-none"
                  />
                </div>

                <div className="space-y-4">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Plataforma</label>
                   <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                     {[
                       { id: 'PC', icon: Monitor },
                       { id: 'PS5', icon: Gamepad2 },
                       { id: 'Xbox', icon: Gamepad2 },
                       { id: 'Switch', icon: Gamepad2 },
                       { id: 'Mobile', icon: Smartphone }
                     ].map((plat) => (
                       <button
                         key={plat.id}
                         type="button"
                         onClick={() => setPlatform(plat.id)}
                         className={cn(
                           "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                           platform === plat.id 
                            ? "bg-[#8B5CF6]/10 border-[#8B5CF6] text-[#8B5CF6]" 
                            : "bg-[#161927] border-[#1E2135] text-slate-400 hover:border-slate-700"
                         )}
                       >
                         <plat.icon className="w-5 h-5" />
                         <span className="text-xs font-bold">{plat.id}</span>
                       </button>
                     ))}
                   </div>
                </div>

                {/* PC Hardware Section */}
                <AnimatePresence>
                  {platform === 'PC' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-4 border-t border-[#1E2135] mt-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Cpu className="w-4 h-4" />
                          <span className="text-sm font-bold uppercase tracking-widest">Hardware (Opcional)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <input 
                               placeholder="Processador (CPU)"
                               value={hardware.cpu}
                               onChange={(e) => setHardware({...hardware, cpu: e.target.value})}
                               className="w-full bg-[#161927] border border-[#1E2135] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6]"
                             />
                          </div>
                          <div className="space-y-2">
                             <input 
                               placeholder="Placa de Vídeo (GPU)"
                               value={hardware.gpu}
                               onChange={(e) => setHardware({...hardware, gpu: e.target.value})}
                               className="w-full bg-[#161927] border border-[#1E2135] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6]"
                             />
                          </div>
                          <div className="space-y-2">
                             <input 
                               placeholder="Memória (RAM)"
                               value={hardware.ram}
                               onChange={(e) => setHardware({...hardware, ram: e.target.value})}
                               className="w-full bg-[#161927] border border-[#1E2135] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6]"
                             />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-bold shadow-xl shadow-[#8B5CF6]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? 'Publicando...' : (
                    <>
                      Publicar Review
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

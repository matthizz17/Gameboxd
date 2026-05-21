import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Settings, 
  Gamepad2, 
  Star, 
  MessageSquare, 
  Heart, 
  Calendar,
  Users,
  Edit3,
  Check,
  Plus,
  Trash2,
  X as XIcon,
  Search,
  UserPlus
} from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { searchGamesGemini } from '../services/geminiService';
import { cn } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';

interface UserData {
  displayName: string;
  photoURL: string;
  bio: string;
  createdAt: any;
  favoriteGames: any[];
}

export default function Profile({ currentUser }: { currentUser: any }) {
  const { userId } = useParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [favoriteGamesData, setFavoriteGamesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      setLoading(true);
      try {
        // Load User Doc
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          setEditBio(data.bio || '');

          // Load Favorite Games Data with high-quality cover arts
          if (data.favoriteGames && data.favoriteGames.length > 0) {
            const favs = data.favoriteGames.slice(0, 4);
            const loadedFavs = await Promise.all(favs.map(async (item: any) => {
              const title = (item && typeof item === 'object') ? item.title : (typeof item === 'string' ? item : '');
              if (!title) return { title: '', coverUrl: '' };

              const lTitle = title.toLowerCase();
              let coverUrl = '';

              // 1. Direct mappings to the high-quality Steam/original cover arts for known games to guarantee matched original covers
              if (lTitle.includes("elden ring")) {
                coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900_2x.jpg";
              } else if (lTitle.includes("god of war ragnar") || lTitle.includes("god of war")) {
                coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/2322010/library_600x900_2x.jpg";
              } else if (lTitle.includes("cyberpunk")) {
                coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg";
              } else if (lTitle.includes("last of us")) {
                coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/1888140/library_600x900_2x.jpg";
              } else if (lTitle.includes("red dead")) {
                coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg";
              } else if (lTitle.includes("hades")) {
                coverUrl = "https://cdn.akamai.steamstatic.com/steam/apps/1145360/library_600x900_2x.jpg";
              }

              // 2. If it's not a known game, use the item's stored coverUrl if valid (non-placeholder)
              if (!coverUrl && item && typeof item === 'object' && item.coverUrl && !item.coverUrl.includes('unsplash')) {
                coverUrl = item.coverUrl;
              }

              // 3. Fallback to check if there are any reviews with this exact gameTitle in the DB to fetch gameCoverUrl
              if (!coverUrl) {
                try {
                  const revQuery = query(
                    collection(db, 'reviews'),
                    where('gameTitle', '==', title),
                    limit(1)
                  );
                  const revSnap = await getDocs(revQuery);
                  if (!revSnap.empty) {
                    const rData = revSnap.docs[0].data();
                    if (rData.gameCoverUrl) {
                      coverUrl = rData.gameCoverUrl;
                    }
                  }
                } catch (e) {
                  console.error("Error querying review for coverArt", e);
                }
              }

              // 4. Fallback search via Gemini
              if (!coverUrl) {
                try {
                  const searchResults = await searchGamesGemini(title);
                  if (searchResults && searchResults.length > 0) {
                    const match = searchResults.find(g => g.title.toLowerCase() === title.toLowerCase()) || searchResults[0];
                    coverUrl = match.coverUrl;
                  }
                } catch (err) {
                  console.error("Error fetching Gemini search for favorite", err);
                }
              }

              // Ultimate placeholder fallback if nothing else succeeded
              if (!coverUrl) {
                coverUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";
              }

              return { title, coverUrl };
            }));
            setFavoriteGamesData(loadedFavs);
          } else {
            setFavoriteGamesData([]);
          }
        } else if (isOwnProfile && currentUser) {
          // Initialize if it's the current user and doc doesn't exist
          const initial = {
            displayName: currentUser.displayName || 'Usuário',
            photoURL: currentUser.photoURL || '',
            bio: 'Hey! Estou usando o Gameboxd.',
            createdAt: serverTimestamp(),
            favoriteGames: []
          };
          await setDoc(doc(db, 'users', userId), initial);
          setUserData(initial as any);
          setEditBio(initial.bio);
        }

        // Load User Reviews
        const q = query(
          collection(db, 'reviews'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const revSnap = await getDocs(q);
        setUserReviews(revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Load Friends (Following IDs)
        const qFriends = query(
          collection(db, 'followers'),
          where('followerId', '==', userId)
        );
        const friendsSnap = await getDocs(qFriends);
        const followingIds = friendsSnap.docs.map(doc => doc.data().followingId);
        setFollowingCount(followingIds.length);

        if (followingIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < followingIds.length; i += 30) {
            chunks.push(followingIds.slice(i, i + 30));
          }
          const loadedFriends: any[] = [];
          for (const chunk of chunks) {
             const usersQuery = query(
               collection(db, 'users'),
               where('__name__', 'in', chunk)
             );
             const uSnap = await getDocs(usersQuery);
             uSnap.docs.forEach(docSnap => {
               loadedFriends.push({ id: docSnap.id, ...docSnap.data() });
             });
          }
          setFriendsList(loadedFriends);
        } else {
          setFriendsList([]);
        }

        // Fetch followers count for this user
        const qFollowers = query(
          collection(db, 'followers'),
          where('followingId', '==', userId)
        );
        const followersSnap = await getDocs(qFollowers);
        setFollowersCount(followersSnap.size);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId, currentUser, isOwnProfile]);

  useEffect(() => {
    async function checkFollowing() {
      if (!currentUser || !userId || isOwnProfile) return;
      const followId = `${currentUser.uid}_${userId}`;
      const followDoc = await getDoc(doc(db, 'followers', followId));
      setIsFollowing(followDoc.exists());
    }
    checkFollowing();
  }, [currentUser, userId, isOwnProfile]);

  const handleFollow = async () => {
    if (!currentUser || !userId) return;
    const followId = `${currentUser.uid}_${userId}`;
    const path = 'followers';
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, path, followId));
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await setDoc(doc(db, path, followId), {
          followerId: currentUser.uid,
          followingId: userId,
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), { bio: editBio });
      setUserData(prev => prev ? { ...prev, bio: editBio } : null);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEdit = (rev: any) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditContent(rev.content);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Você tem certeza que deseja excluir esta review?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setUserReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (e) {
      console.error("Erro ao deletar review:", e);
      alert("Não foi possível excluir a review.");
    }
  };

  const handleAddFriend = async (friend: any) => {
    if (!currentUser) return alert("Faça login para adicionar amigos");
    const followId = `${currentUser.uid}_${friend.id}`;
    const path = 'followers';
    try {
      await setDoc(doc(db, path, followId), {
        followerId: currentUser.uid,
        followingId: friend.id,
        createdAt: serverTimestamp()
      });
      setFriendsList(prev => [...prev, friend]);
      setFollowingCount(prev => prev + 1);
    } catch (e) {
      console.error("Erro ao adicionar amigo:", e);
      alert("Não foi possível adicionar o amigo.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;
    const followId = `${currentUser.uid}_${friendId}`;
    const path = 'followers';
    try {
      await deleteDoc(doc(db, path, followId));
      setFriendsList(prev => prev.filter(f => f.id !== friendId));
      setFollowingCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Erro ao remover amigo:", e);
      alert("Não foi possível remover o amigo.");
    }
  };

  const handleSearchFriends = async (e: FormEvent) => {
    e.preventDefault();
    const queryName = searchQuery.trim().toLowerCase();
    if (!queryName) return;
    setSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(query(usersRef, limit(100)));
      const list = usersSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const filtered = list.filter((u: any) => 
        u.displayName?.toLowerCase().includes(queryName) && u.id !== currentUser?.uid
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setSubmittingEdit(true);
    try {
      const reviewRef = doc(db, 'reviews', editingReview.id);
      await updateDoc(reviewRef, {
        rating: editRating,
        content: editContent
      });

      setUserReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, rating: editRating, content: editContent } : r));
      setEditingReview(null);
    } catch (e) {
      console.error("Erro ao salvar review:", e);
      alert("Não foi possível salvar as alterações.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) return <div className="py-24 text-center animate-bounce"><Gamepad2 className="w-12 h-12 mx-auto text-[#8B5CF6]" /></div>;
  if (!userData) return <div className="py-24 text-center">Perfil não encontrado.</div>;

  return (
    <div className="space-y-12">
      {/* Profile Header */}
      <section className="relative p-8 md:p-12 bg-gradient-to-br from-[#161927] to-[#0B0C15] border border-[#1E2135] rounded-[3rem] overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className="relative group">
              <img 
                src={userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-[#1E2135] object-cover shadow-2xl" 
                alt={userData.displayName} 
              />
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center cursor-pointer">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
              )}
           </div>
           
           <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                 <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">{userData.displayName}</h1>
                 {isOwnProfile ? (
                   <button 
                     onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                     className="px-4 py-1.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-bold rounded-full transition-all flex items-center gap-2 mx-auto md:mx-0"
                   >
                     {isEditing ? <><Check className="w-3 h-3" /> Salvar</> : <><Settings className="w-3 h-3" /> Editar Perfil</>}
                   </button>
                 ) : (
                   <button 
                    onClick={handleFollow}
                    className={cn(
                      "px-6 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 mx-auto md:mx-0",
                      isFollowing ? "bg-[#1E2135] text-slate-400 border border-[#2A2D45]" : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                    )}
                   >
                      {isFollowing ? 'Seguindo' : <><Plus className="w-3 h-3" /> Seguir</>}
                   </button>
                 )}
              </div>
              
              <div className="space-y-4">
                 {isEditing ? (
                   <textarea 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full h-24 bg-[#0B0C15] border border-[#1E2135] rounded-xl p-3 text-sm focus:outline-none focus:border-[#8B5CF6]"
                   />
                 ) : (
                   <p className="text-slate-400 max-w-xl text-lg leading-relaxed">{userData.bio}</p>
                 )}
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
                 <div className="flex flex-col">
                    <span className="text-2xl font-black text-white italic">{userReviews.length}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Reviews</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-2xl font-black text-white italic">{followersCount}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Seguidores</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-2xl font-black text-white italic">{followingCount}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Seguindo</span>
                 </div>
                 <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium italic">Entrou em Maio 2026</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Backdrop Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#8B5CF6]/20 blur-[100px]" />
      </section>

      {/* Profile Tabs/Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
        <div className="space-y-12">
           <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Reviews Recentes</h2>
                <Link to="#" className="text-sm font-medium text-[#8B5CF6] hover:underline">Ver todas</Link>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                 {userReviews.length > 0 ? userReviews.map(rev => (
                   <div key={rev.id} className="p-6 bg-[#161927] border border-[#1E2135] rounded-3xl flex flex-col md:flex-row gap-6 group hover:border-[#8B5CF6]/50 transition-colors">
                      <Link to={`/game/${encodeURIComponent(rev.gameTitle)}`} className="w-24 h-36 flex-shrink-0 bg-[#0B0C15] rounded-xl overflow-hidden border border-[#1E2135]">
                         <img src={rev.gameCoverUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                      </Link>
                      <div className="flex-1 space-y-3">
                         <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl group-hover:text-[#8B5CF6] transition-colors">{rev.gameTitle}</h3>
                            <div className="flex gap-0.5">
                               {Array(5).fill(0).map((_, i) => (
                                 <Star key={i} className={cn("w-3 h-3", rev.rating > i ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-slate-700")} />
                               ))}
                            </div>
                         </div>
                         <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed italic">"{rev.content}"</p>
                         <div className="flex items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-2 text-slate-500">
                                  <Heart className="w-4 h-4" />
                                  <span className="text-xs font-bold text-slate-400">{rev.likesCount}</span>
                               </div>
                               <div className="flex items-center gap-2 text-slate-500">
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-xs font-bold text-slate-400">0</span>
                                </div>
                             </div>

                             {isOwnProfile && (
                                <div className="flex items-center gap-2">
                                   <button 
                                      onClick={() => handleStartEdit(rev)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-all"
                                   >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Editar</span>
                                   </button>
                                   <button 
                                      onClick={() => handleDeleteReview(rev.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all"
                                   >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Excluir</span>
                                   </button>
                                </div>
                             )}
                          </div>
                      </div>
                   </div>
                 )) : (
                   <div className="p-12 text-center bg-[#161927]/50 rounded-3xl border border-dashed border-[#1E2135]">
                      <p className="text-slate-500 italic">O usuário ainda não escreveu nenhuma review.</p>
                   </div>
                 )}
              </div>
           </section>
        </div>

        {/* Favorites Sidebar */}
        <aside className="space-y-8">
           <div className="p-6 bg-[#161927] border border-[#1E2135] rounded-[2.5rem] space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold flex items-center gap-2 italic tracking-tight">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    JOGOS FAVORITOS
                 </h3>
                 {isOwnProfile && <Link to="/search" className="p-2 hover:bg-white/5 rounded-full"><Plus className="w-4 h-4 text-slate-500" /></Link>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                 {favoriteGamesData.length > 0 ? favoriteGamesData.map((game, i) => (
                   <Link key={i} to={`/game/${encodeURIComponent(game.title)}`} className="aspect-[3/4] bg-[#0B0C15] rounded-xl border border-[#1E2135] overflow-hidden relative group block">
                                            {game.coverUrl ? (
                        <img 
                          src={game.coverUrl} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          alt={game.title} 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:text-[#8B5CF6] text-center p-2 uppercase italic">
                          {game.title}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 text-center">
                        <span className="text-xs font-bold text-white line-clamp-2">{game.title}</span>
                      </div>
                   </Link>
                 )) : [1, 2, 3, 4].map(i => (
                   <div key={i} className="aspect-[3/4] bg-[#0B0C15] rounded-xl border border-[#1E2135] border-dashed flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-slate-800" />
                   </div>
                 ))}
              </div>
              
              <p className="text-xs text-slate-500 text-center italic">Personalize seu perfil destacando seus jogos preferidos aqui.</p>
           </div>
           
           <div className="p-6 bg-[#161927] border border-[#1E2135] rounded-[2.5rem] space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold flex items-center gap-2 italic tracking-tight uppercase">
                   <Users className="w-4 h-4 text-blue-500" />
                   Amigos
                 </h3>
                 {isOwnProfile && (
                    <button 
                       onClick={() => setShowFriendsModal(true)} 
                       className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                       <Plus className="w-4 h-4" />
                    </button>
                 )}
              </div>
              
              {friendsList.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {friendsList.slice(0, 5).map((friend) => (
                       <Link 
                          key={friend.id} 
                          to={`/profile/${friend.id}`} 
                          title={friend.displayName}
                          className="w-10 h-10 rounded-full border-2 border-[#161927] hover:border-[#8B5CF6] overflow-hidden transition-all duration-300 block relative group"
                       >
                          <img 
                             src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} 
                             className="w-full h-full object-cover" 
                             alt={friend.displayName} 
                          />
                       </Link>
                    ))}
                    {friendsList.length > 5 && (
                       <button 
                          onClick={() => setShowFriendsModal(true)}
                          className="w-10 h-10 rounded-full bg-[#1E2135] hover:bg-[#2A2D45] flex items-center justify-center text-[10px] font-bold text-slate-400 transition-all border-2 border-[#161927]"
                       >
                          +{friendsList.length - 5}
                       </button>
                    )}
                 </div>
              ) : (
                 <div className="text-center py-6 bg-[#0B0C15]/50 border border-dashed border-[#1E2135] rounded-2xl">
                    <p className="text-xs text-slate-500 italic">Nenhum amigo ainda.</p>
                    {isOwnProfile && (
                       <button 
                          onClick={() => setShowFriendsModal(true)}
                          className="mt-2 text-[10px] text-[#8B5CF6] hover:underline font-bold uppercase tracking-wider block mx-auto"
                       >
                          Adicionar pessoas
                       </button>
                    )}
                 </div>
              )}
           </div>
        </aside>
      </div>

      {/* Review Edit Modal */}
      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setEditingReview(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-[#161927] border border-[#1E2135] rounded-3xl overflow-hidden shadow-2xl z-[101]"
            >
               <div className="p-6 border-b border-[#1E2135] flex items-center justify-between">
                  <h2 className="text-xl font-bold">Editar Review: {editingReview.gameTitle}</h2>
                  <button onClick={() => setEditingReview(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                    <XIcon className="w-6 h-6" />
                  </button>
               </div>
               
               <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
                  {/* Rating Selector */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block font-sans">Sua Avaliação</label>
                     <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                           <motion.button
                              type="button"
                              key={starValue}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditRating(starValue)}
                              className="text-2xl transition-colors"
                           >
                              <Star 
                               className={cn(
                                 "w-8 h-8", 
                                 editRating >= starValue ? "text-yellow-400 fill-yellow-400" : "text-slate-700"
                               )} 
                              />
                           </motion.button>
                        ))}
                     </div>
                  </div>

                  {/* Review Input */}
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block font-sans">Sua Opinião</label>
                     <textarea 
                        required
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-[#0B0C15] border border-[#1E2135] rounded-2xl p-4 text-sm focus:border-[#8B5CF6]/50 outline-none min-h-[150px] transition-colors"
                        placeholder="O que achou do jogo? Jogabilidade, gráficos, história..."
                     />
                  </div>

                  <motion.button 
                    disabled={submittingEdit}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-[#8B5CF6]/30 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingEdit ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-[#8B5CF6] rounded-full"
                        />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </motion.button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search & Manage Friends Modal */}
      <AnimatePresence>
        {showFriendsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                  setShowFriendsModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
               }}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-[#161927] border border-[#1E2135] rounded-3xl overflow-hidden shadow-2xl z-[101]"
            >
               <div className="p-6 border-b border-[#1E2135] flex items-center justify-between">
                  <div>
                     <h2 className="text-xl font-bold">Procurar & Adicionar Amigos</h2>
                     <p className="text-xs text-slate-500 mt-1">Busque outros usuários da plataforma e adicione-os à sua rede.</p>
                  </div>
                  <button 
                     onClick={() => {
                        setShowFriendsModal(false);
                        setSearchQuery('');
                        setSearchResults([]);
                     }} 
                     className="p-2 hover:bg-white/5 rounded-full text-slate-400"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="p-6 space-y-6">
                  {/* Search bar */}
                  <form onSubmit={handleSearchFriends} className="flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type="text"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="Buscar amigos por nome..."
                           className="w-full bg-[#0B0C15] border border-[#1E2135] rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-[#8B5CF6]/50 outline-none transition-colors"
                        />
                     </div>
                     <button 
                        type="submit"
                        className="px-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-bold transition-all text-sm flex items-center gap-2"
                     >
                        Buscar
                     </button>
                  </form>

                  {/* Search Results list */}
                  {searchQuery.trim() !== '' && (
                     <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-sans">Resultados da Busca</h4>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 font-sans">
                           {searching ? (
                              <div className="py-8 text-center text-slate-400 text-sm">Buscando...</div>
                           ) : searchResults.length > 0 ? (
                              searchResults.map((userObj) => {
                                 const isAlreadyFriend = friendsList.some(f => f.id === userObj.id);
                                 return (
                                    <div key={userObj.id} className="flex items-center justify-between p-3 bg-[#0B0C15]/40 border border-[#1E2135] rounded-2xl hover:border-[#1E2135]/80 transition-colors">
                                       <Link 
                                          to={`/profile/${userObj.id}`} 
                                          onClick={() => setShowFriendsModal(false)}
                                          className="flex items-center gap-3 group"
                                       >
                                          <img 
                                             src={userObj.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userObj.id}`} 
                                             className="w-10 h-10 rounded-xl object-cover transition-transform group-hover:scale-105" 
                                             alt={userObj.displayName} 
                                          />
                                          <div>
                                             <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{userObj.displayName}</h4>
                                             <p className="text-xs text-slate-500 line-clamp-1 italic">{userObj.bio || "Sem bio."}</p>
                                          </div>
                                       </Link>
                                       
                                       {isAlreadyFriend ? (
                                          <button 
                                             onClick={() => handleRemoveFriend(userObj.id)}
                                             className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all"
                                          >
                                             Remover
                                          </button>
                                       ) : (
                                          <button 
                                             type="button"
                                             onClick={() => handleAddFriend(userObj)}
                                             className="px-4 py-2 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 text-[#8B5CF6] hover:text-[#9F7AEA] text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                                          >
                                             <UserPlus className="w-3.5 h-3.5" />
                                             Adicionar
                                          </button>
                                       )}
                                    </div>
                                 );
                              })
                           ) : (
                              <div className="py-8 text-center text-slate-500 italic text-sm font-sans">Nenhum usuário encontrado.</div>
                           )}
                        </div>
                     </div>
                  )}

                  {/* My friends backup list if no search results/query holds */}
                  {searchResults.length === 0 && friendsList.length > 0 && !searching && (
                     <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-sans">Seus Amigos ({friendsList.length})</h4>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 font-sans">
                           {friendsList.map((friend) => (
                              <div key={friend.id} className="flex items-center justify-between p-3 bg-[#0B0C15]/40 border border-[#1E2135] rounded-2xl">
                                 <Link 
                                    to={`/profile/${friend.id}`} 
                                    onClick={() => setShowFriendsModal(false)}
                                    className="flex items-center gap-3"
                                 >
                                    <img 
                                       src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} 
                                       className="w-10 h-10 rounded-xl object-cover" 
                                       alt={friend.displayName} 
                                    />
                                    <div>
                                       <h4 className="text-sm font-bold text-slate-200">{friend.displayName}</h4>
                                       <p className="text-xs text-slate-500 line-clamp-1 italic">{friend.bio || "Sem bio."}</p>
                                    </div>
                                 </Link>
                                 
                                 <button 
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="px-4 py-2 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 text-red-400 text-xs font-bold rounded-xl transition-all"
                                 >
                                    Remover
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

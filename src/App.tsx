/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Star, 
  Monitor, 
  Heart, 
  MessageSquare,
  Users,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { cn } from './lib/utils';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import GameDetails from './pages/GameDetails';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import CreateReview from './pages/CreateReview';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Gamepad2 className="w-12 h-12 text-[#8B5CF6]" />
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0B0C15] text-slate-100 font-sans selection:bg-[#8B5CF6]/30">
        <Navbar user={user} login={login} logout={logout} />
        
        <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/game/:id" element={<GameDetails />} />
            <Route path="/profile/:userId" element={<Profile currentUser={user} />} />
            <Route path="/favorites" element={<Favorites user={user} />} />
            <Route path="/create-review" element={<CreateReview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Navbar({ user, login, logout }: { user: FirebaseUser | null, login: () => void, logout: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', path: '/', icon: Gamepad2 },
    { name: 'Explorar', path: '/search', icon: LayoutGrid },
    ...(user ? [
      { name: 'Criar Review', path: '/create-review', icon: Star },
      { name: 'Favoritos', path: '/favorites', icon: Heart },
      { name: 'Perfil', path: `/profile/${user.uid}`, icon: User }
    ] : []),
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
      isScrolled ? "bg-[#0B0C15]/80 backdrop-blur-xl border-[#1E2135]" : "bg-transparent border-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-xl group-hover:rotate-6 transition-transform">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gameboxd
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#8B5CF6]",
                location.pathname === link.path ? "text-[#8B5CF6]" : "text-slate-400"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-6 w-[1px] bg-[#1E2135]" />

          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/search')}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={logout}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                id="logout-btn"
              >
                Sair
              </button>
              <Link to={`/profile/${user.uid}`}>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-[#1E2135]"
                />
              </Link>
            </div>
          ) : (
            <button 
              onClick={login}
              className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#8B5CF6]/20"
              id="login-btn"
            >
              Entrar com Google
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-[#0B0C15] border-b border-[#1E2135] p-4 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3 hover:bg-[#161927] rounded-xl transition-colors"
              >
                <link.icon className="w-5 h-5 text-[#8B5CF6]" />
                <span className="font-medium text-slate-200">{link.name}</span>
              </Link>
            ))}
            {!user && (
              <button 
                onClick={login}
                className="w-full p-4 bg-[#8B5CF6] text-white rounded-xl font-bold"
              >
                Entrar com Google
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

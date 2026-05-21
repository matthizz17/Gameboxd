import { Heart, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Favorites({ user }: { user: any }) {
  return (
    <div className="py-24 text-center space-y-6">
      <div className="inline-flex p-6 bg-[#161927] rounded-3xl border border-[#1E2135]">
        <Heart className="w-12 h-12 text-pink-500 fill-current" />
      </div>
      <h1 className="text-4xl font-bold italic tracking-tighter uppercase">Meus Favoritos</h1>
      <p className="text-slate-400 max-w-md mx-auto">
        Aqui você poderá ver todos os jogos e reviews que você marcou como favoritos.
      </p>
      <div className="pt-8">
        <Link 
          to="/search" 
          className="px-8 py-4 bg-[#8B5CF6] text-white rounded-2xl font-bold shadow-xl shadow-[#8B5CF6]/30 inline-flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Descobrir Jogos
        </Link>
      </div>
    </div>
  );
}

export interface GameResult {
  title: string;
  description: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  categories: string[];
  coverUrl: string;
  platforms: string[];
}

// Low-latency high-quality search/recommendation fallback database
const FALLBACK_GAMES: GameResult[] = [
  {
    title: "The Witcher 3: Wild Hunt",
    description: "Incorpore Geralt de Rivia, um caçador de monstros mercenário em um continente devastado pela guerra e infestado de monstros. Seu contrato atual? Rastrear Ciri — a Criança da Profecia, uma arma viva capaz de alterar a própria forma do mundo.",
    releaseDate: "2015",
    developer: "CD PROJEKT RED",
    publisher: "CD PROJEKT RED",
    categories: ["RPG", "Aventura", "Mundo Aberto"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Elden Ring",
    description: "Levante-se, Maculado, e seja guiado pela graça para portar o poder do Anel Prístino e se tornar um Lorde Prístino nas Terras Entre. Um mundo vasto onde campos abertos e masmorras complexas em 3D se conectam de forma contínua.",
    releaseDate: "2022",
    developer: "FromSoftware Inc.",
    publisher: "Bandai Namco Entertainment",
    categories: ["RPG", "Ação", "Souls-like"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One"]
  },
  {
    title: "Cyberpunk 2077",
    description: "Um RPG de ação e aventura em mundo aberto ambientado em Night City, uma megalópole obcecada por poder, glamour e modificação corporal. Jogue como V, um mercenário urbano, lutando por glória e sobrevivência.",
    releaseDate: "2020",
    developer: "CD PROJEKT RED",
    publisher: "CD PROJEKT RED",
    categories: ["RPG", "Ação", "Mundo Aberto", "Ficção Científica"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One"]
  },
  {
    title: "Hades",
    description: "Desafie o deus dos mortos enquanto você batalha por sua liberdade para sair do Submundo neste jogo estilo rogue-like dungeon crawler dos criadores de Bastion, Transistor e Pyre.",
    releaseDate: "2020",
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    categories: ["Ação", "Rogue-like", "Indie"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1145360/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Red Dead Redemption 2",
    description: "Vencedor de mais de 175 prêmios de Jogo do Ano e receptor de mais de 250 avaliações perfeitas, Red Dead Redemption 2 é uma história épica de honra e lealdade no início dos tempos modernos.",
    releaseDate: "2018",
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    categories: ["Ação", "Aventura", "Mundo Aberto"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One"]
  },
  {
    title: "Grand Theft Auto V",
    description: "Grand Theft Auto V para PC oferece aos jogadores a opção de explorar o premiado mundo de Los Santos e Blaine County em resoluções de até 4k e além, a 60 quadros por segundo.",
    releaseDate: "2013",
    developer: "Rockstar North",
    publisher: "Rockstar Games",
    categories: ["Ação", "Mundo Aberto", "Crime"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/271590/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One"]
  },
  {
    title: "Stardew Valley",
    description: "Você herdou o antigo lote de fazenda do seu avô em Stardew Valley. Equipado com ferramentas usadas e poucas moedas, você parte para começar sua nova vida no campo.",
    releaseDate: "2016",
    developer: "ConcernedApe",
    publisher: "ConcernedApe",
    categories: ["Simulação", "RPG", "Farming", "Cozy"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/413150/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Hollow Knight",
    description: "Forje seu próprio caminho em Hollow Knight! Uma aventura de ação clássica em estilo 2D desenhado à mão por um vasto reino arruinado de insetos e heróis.",
    releaseDate: "2017",
    developer: "Team Cherry",
    publisher: "Team Cherry",
    categories: ["Metroidvania", "Ação", "Indie"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/367520/library_600x900_2x.jpg",
    platforms: ["PC", "PS4", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Terraria",
    description: "Cave, batalhe, explore, construa: o próprio mundo está ao seu alcance enquanto você luta pela sobrevivência, fortuna e glória em cavernas profundas ou enfrentando chefões terríveis.",
    releaseDate: "2011",
    developer: "Re-Logic",
    publisher: "Re-Logic",
    categories: ["Mundo Aberto", "Sobrevivência", "Sandbox", "Indie"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/105600/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Portal 2",
    description: "Portal 2 baseia-se na fórmula premiada de jogabilidade inovadora, história e música que renderam ao Portal original mais de 70 prêmios e uma legião de fãs fervorosos.",
    releaseDate: "2011",
    developer: "Valve",
    publisher: "Valve",
    categories: ["Puzzle", "Plataforma", "Clássico", "Ficção Científica"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/620/library_600x900_2x.jpg",
    platforms: ["PC", "Xbox Series X/S", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Minecraft",
    description: "Explore mundos gerados aleatoriamente e construa das coisas mais simples, como uma cabana, aos castelos mais grandiosos. Jogue no modo criativo ou sobreviva a perigos no modo sobrevivência.",
    releaseDate: "2011",
    developer: "Mojang Studios",
    publisher: "Xbox Game Studios",
    categories: ["Sandbox", "Sobrevivência", "Criativo", "Mundo Aberto"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1131120/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "PS4", "Xbox Series X/S", "Xbox One", "Nintendo Switch"]
  },
  {
    title: "Baldur's Gate 3",
    description: "Reúna seu grupo e retorne aos Reinos Esquecidos em uma história de companheirismo e traição, sacrifício e sobrevivência, e a atração do poder absoluto. Desperte habilidades misteriosas originadas por um parasita devorador de mentes.",
    releaseDate: "2023",
    developer: "Larian Studios",
    publisher: "Larian Studios",
    categories: ["RPG", "Estratégia", "Fantasia"],
    coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/library_600x900_2x.jpg",
    platforms: ["PC", "PS5", "Xbox Series X/S"]
  }
];

async function callGeminiApi(body: {
  type: "search" | "recommend";
  query?: string;
  category?: string;
}): Promise<GameResult[]> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function searchGamesGemini(query: string): Promise<GameResult[]> {
  if (!query) return [];

  const cleanQuery = query.trim();

  try {
    return await callGeminiApi({ type: "search", query: cleanQuery });
  } catch (e) {
    console.error("Failed to fetch games from API, returning local fallback matches", e);
    const lowerQuery = cleanQuery.toLowerCase();
    const matches = FALLBACK_GAMES.filter(g =>
      g.title.toLowerCase().includes(lowerQuery) ||
      g.categories.some(c => c.toLowerCase().includes(lowerQuery)) ||
      g.developer.toLowerCase().includes(lowerQuery)
    );
    return matches.length > 0 ? matches : FALLBACK_GAMES.slice(0, 4);
  }
}

export async function getRecommendedGamesGemini(category?: string): Promise<GameResult[]> {
  try {
    return await callGeminiApi({ type: "recommend", category });
  } catch (e) {
    console.error("Failed to fetch recommendations from API, returning curated fallback data", e);
    if (category) {
      const lowerCat = category.toLowerCase();
      const catMatches = FALLBACK_GAMES.filter(g =>
        g.categories.some(c => c.toLowerCase().includes(lowerCat))
      );
      if (catMatches.length > 0) return catMatches;
    }
    return FALLBACK_GAMES.slice(0, category ? 6 : 12);
  }
}
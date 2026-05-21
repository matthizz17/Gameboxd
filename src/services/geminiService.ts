import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

// Helper to execute calls with exponential retries and fallback models
async function generateContentWithRetry(params: {
  contents: string;
  config?: any;
}): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let delay = 1000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini API call failed for model ${modelName} on attempt ${attempt}:`, error);

        const errMsg = String(error?.message || '').toLowerCase();
        const errStatus = String(error?.status || '').toUpperCase();
        const errCode = error?.code;

        const isTemporaryError = 
          errMsg.includes('503') || 
          errMsg.includes('unavailable') || 
          errMsg.includes('high demand') || 
          errMsg.includes('temporary') || 
          errMsg.includes('quota') ||
          errMsg.includes('limit') ||
          errMsg.includes('exhausted') ||
          errStatus.includes('UNAVAILABLE') || 
          errStatus.includes('RESOURCE_EXHAUSTED') ||
          errCode === 503 ||
          errCode === 429;

        if (isTemporaryError && attempt < 3) {
          console.log(`Retrying Gemini call in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2.5; 
        } else {
          break; // Fall through to try next model or quit
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models and retries failed");
}

export async function searchGamesGemini(query: string): Promise<GameResult[]> {
  if (!query) return [];

  const cleanQuery = query.trim();

  try {
    const response = await generateContentWithRetry({
      contents: `Search for real video games matching the query: "${cleanQuery}". 
      IMPORTANT: You MUST write the description, developer, publisher and categories in Brazilian Portuguese (Português do Brasil). The content should feel natural and fluid for a Brazilian user. Do NOT write them in English.
      
      Return a list of games with their title, a brief description, release date (return only the 4-digit year), developer, publisher, and categories. 
      Also include the platforms the game is available on (e.g., PC, PlayStation 5, Xbox Series X/S, Nintendo Switch).
      
      IMPORTANT: For the coverUrl, you MUST provide a direct URL to the official high-quality box art or library capsule. 
      STRATEGY FOR ACCURATE IMAGES:
      1. If the game is on Steam, use: https://cdn.akamai.steamstatic.com/steam/apps/[APP_ID]/library_600x900_2x.jpg (replace [APP_ID] with the actual numeric Steam AppID).
      2. If not on Steam, use official store CDN URLs from PlayStation (PSN), Xbox, or Nintendo.
      3. Ensure the URL is valid and points directly to an image file (jpg/png).
      4. NEVER use generic stock photos or random image services.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              releaseDate: { type: Type.STRING },
              developer: { type: Type.STRING },
              publisher: { type: Type.STRING },
              categories: { type: Type.ARRAY, items: { type: Type.STRING } },
              coverUrl: { type: Type.STRING },
              platforms: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const text = response.text || '[]';
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    console.error("Failed to fetch or parse Gemini response for games search, returning local fallback matches", e);
    // Graceful offline/busy search matching from the local curated database
    const lowerQuery = cleanQuery.toLowerCase();
    const matches = FALLBACK_GAMES.filter(g => 
      g.title.toLowerCase().includes(lowerQuery) || 
      g.categories.some(c => c.toLowerCase().includes(lowerQuery)) ||
      g.developer.toLowerCase().includes(lowerQuery)
    );
    // If no perfect match found locally, return a subset of our awesome fallsbacks so there's always rich content
    return matches.length > 0 ? matches : FALLBACK_GAMES.slice(0, 4);
  }
}

export async function getRecommendedGamesGemini(category?: string): Promise<GameResult[]> {
  const prompt = category 
    ? `Recommend 6 popular video games in the category: "${category}". 
       IMPORTANT: You MUST write the description, developer, publisher and categories in Brazilian Portuguese (Português do Brasil). The content should feel natural and fluid for a Brazilian user. Do NOT write them in English.
       Return details in JSON format including platforms (PC, PS5, Xbox, Switch).
       IMPORTANT: For coverUrl, use official Steam library art: https://cdn.akamai.steamstatic.com/steam/apps/[APP_ID]/library_600x900_2x.jpg (find the correct AppID).`
    : `Recommend 12 modern and classic popular video games across different genres. 
       IMPORTANT: You MUST write the description, developer, publisher and categories in Brazilian Portuguese (Português do Brasil). The content should feel natural and fluid for a Brazilian user. Do NOT write them in English.
       Return details in JSON format including platforms (PC, PS5, Xbox, Switch).
       IMPORTANT: For coverUrl, use official Steam library art: https://cdn.akamai.steamstatic.com/steam/apps/[APP_ID]/library_600x900_2x.jpg (find the correct AppID).`;

  try {
    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              releaseDate: { type: Type.STRING },
              developer: { type: Type.STRING },
              publisher: { type: Type.STRING },
              categories: { type: Type.ARRAY, items: { type: Type.STRING } },
              coverUrl: { type: Type.STRING },
              platforms: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const text = response.text || '[]';
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    console.error("Failed to fetch or parse Gemini response for recommendations, returning curated fallback data", e);
    if (category) {
      const lowerCat = category.toLowerCase();
      const catMatches = FALLBACK_GAMES.filter(g => 
        g.categories.some(c => c.toLowerCase().includes(lowerCat))
      );
      if (catMatches.length > 0) return catMatches;
    }
    // Return a random selection of fallbacks
    return FALLBACK_GAMES.slice(0, category ? 6 : 12);
  }
}

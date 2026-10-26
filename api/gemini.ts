import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

const PT_BR =
  "IMPORTANT: You MUST write the description, developer, publisher and categories in Brazilian Portuguese (Português do Brasil). Do NOT write them in English.";

const COVER =
  "For coverUrl, use official Steam library art: https://cdn.akamai.steamstatic.com/steam/apps/[APP_ID]/library_600x900_2x.jpg (replace [APP_ID] with the correct numeric Steam AppID). If the game is not on Steam, use official PlayStation, Xbox or Nintendo store image URLs. Never use stock photos.";

const config = {
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
        platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  },
};

function buildPrompt(type: string, query: string, category: string) {
  if (type === "search") {
    return `Search for real video games matching the query: "${query}". ${PT_BR}
Return title, a brief description, release date (only the 4-digit year), developer, publisher, categories and platforms (e.g. PC, PlayStation 5, Xbox Series X/S, Nintendo Switch). ${COVER}`;
  }
  if (type === "recommend") {
    const what = category
      ? `Recommend 6 popular video games in the category: "${category}".`
      : "Recommend 12 modern and classic popular video games across different genres.";
    return `${what} ${PT_BR}
Return details in JSON format including platforms (PC, PS5, Xbox, Switch). ${COVER}`;
  }
  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, query, category } = req.body || {};
  const cleanQuery = String(query || "").trim().slice(0, 100);
  const cleanCategory = String(category || "").trim().slice(0, 50);

  if (type === "search" && !cleanQuery) {
    return res.status(400).json({ error: "Missing query" });
  }

  const prompt = buildPrompt(type, cleanQuery, cleanCategory);
  if (!prompt) {
    return res.status(400).json({ error: "Invalid type" });
  }

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    } catch (e) {
      console.warn(`Model ${model} failed`, e);
    }
  }

  return res.status(502).json({ error: "AI unavailable" });
}
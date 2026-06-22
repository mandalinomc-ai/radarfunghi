/**
 * Verifica rapida integrazione Gemini / Mastro Fungaiolo.
 * Uso: GEMINI_API_KEY=... node scripts/verify-gemini.mjs
 */
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
const model = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.0-flash";

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY mancante. Imposta la variabile e riprova.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const hotspots = [
  {
    id: "taburno-castello",
    name: "Taburno — Castello",
    sproutScore: 78,
    distanceKm: 42,
  },
];

const systemInstruction = `Sei il Mastro Fungaiolo di MushroomRadar. Rispondi solo con dati forniti: ${JSON.stringify(hotspots)}`;

try {
  const response = await ai.models.generateContent({
    model,
    contents: 'Dove trovo porcini oggi?',
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING },
          recommendedHotspotId: { type: Type.STRING, nullable: true },
        },
        required: ["reply", "recommendedHotspotId"],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Risposta vuota");

  const parsed = JSON.parse(text);
  console.log("✅ Gemini OK — modello:", model);
  console.log(JSON.stringify(parsed, null, 2));
} catch (error) {
  console.error("❌ Test Gemini fallito:", error instanceof Error ? error.message : error);
  process.exit(1);
}

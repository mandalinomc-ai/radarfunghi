import { getGeminiClient } from "./geminiChatConfig";
import { SPY_MUSHROOMS } from "./spyMushroomIntel";

export interface ClassifierResult {
  scientificName: string;
  commonName: string;
  edibility: "commestibile" | "tossico" | "velenoso" | "sconosciuto" | "non_commestibile";
  confidence: number;
  actionPlan: string[];
  legalDisclaimer: string;
  isSpyMushroom: boolean;
  spyId?: string;
}

const DEFAULT_DISCLAIMER =
  "Non mangiare mai un fungo identificato solo da foto o app. Consulta sempre un micologo ASL. In emergenza avvelenamento: CAV 24/7.";

export async function classifyMushroomImage(
  imageBase64: string,
  mimeType: string
): Promise<ClassifierResult> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return fallbackResult("Servizio AI non configurato (GEMINI_API_KEY).");
  }

  const model = process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash";
  const ai = getGeminiClient();

  const prompt = `Sei un micologo conservativo. Analizza la foto del fungo e rispondi SOLO in JSON valido:
{
  "scientificName": string,
  "commonName": string,
  "edibility": "commestibile"|"tossico"|"velenoso"|"non_commestibile"|"sconosciuto",
  "confidence": number 0-100,
  "actionPlan": string[] (3-5 bullet in italiano)
}
Non dare certezza assoluta.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64.replace(/^data:[^;]+;base64,/, ""),
              },
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Risposta non JSON");

    const parsed = JSON.parse(jsonMatch[0]) as Omit<
      ClassifierResult,
      "legalDisclaimer" | "isSpyMushroom" | "spyId"
    >;

    const spy = SPY_MUSHROOMS.find(
      (s) =>
        parsed.scientificName
          .toLowerCase()
          .includes(s.scientificName.split(" ")[0].toLowerCase()) ||
        parsed.commonName
          .toLowerCase()
          .includes(s.commonName.toLowerCase().slice(0, 6))
    );

    return {
      ...parsed,
      legalDisclaimer: DEFAULT_DISCLAIMER,
      isSpyMushroom: Boolean(spy),
      spyId: spy?.id,
    };
  } catch {
    return fallbackResult("Identificazione non disponibile. Ripeti con foto più nitida.");
  }
}

function fallbackResult(msg: string): ClassifierResult {
  return {
    scientificName: "—",
    commonName: "Non identificato",
    edibility: "sconosciuto",
    confidence: 0,
    actionPlan: [msg, "Non consumare.", "Consulta un esperto sul campo."],
    legalDisclaimer: DEFAULT_DISCLAIMER,
    isSpyMushroom: false,
  };
}

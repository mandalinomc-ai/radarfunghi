import type { MastroHotspotPayload } from "./mastroHotspotMapper";

import type { MastroChatResponse } from "./mastroTypes";



const GEMINI_REST_BASE =

  "https://generativelanguage.googleapis.com/v1beta/models";



const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



/** Exponential backoff — chat: max 2 tentativi */

export async function fetchWithExponentialBackoff(

  url: string,

  options: RequestInit,

  retries = 2,

  delay = 800

): Promise<Response> {

  try {

    const response = await fetch(url, options);



    if (!response.ok && retries > 0) {

      await wait(delay);

      return fetchWithExponentialBackoff(url, options, retries - 1, delay * 2);

    }

    return response;

  } catch {

    if (retries > 0) {

      await wait(delay);

      return fetchWithExponentialBackoff(url, options, retries - 1, delay * 2);

    }

    throw new Error("Rete Gemini non raggiungibile");

  }

}



export interface MastroRestRequest {

  userMessage: string;

  hotspots: MastroHotspotPayload[];

  systemPrompt: string;

  apiKey: string;

  modelName: string;

  conversationHistory?: Array<{ role: "user" | "model"; text: string }>;

}



function buildRestContents(

  userMessage: string,

  history?: Array<{ role: "user" | "model"; text: string }>

): Array<{ role: string; parts: Array<{ text: string }> }> {

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];



  if (history?.length) {

    for (const turn of history.slice(-6)) {

      contents.push({

        role: turn.role,

        parts: [{ text: turn.text.slice(0, 1500) }],

      });

    }

  }



  contents.push({

    role: "user",

    parts: [

      {

        text: `Domanda attuale: "${userMessage}"\n\nRispondi alla domanda attuale tenendo conto della cronologia. Compila lo schema JSON richiesto.`,

      },

    ],

  });



  return contents;

}



/** Chiamata REST nativa Gemini (mastro_fungaiolo_gemini_server_action.ts) */

export async function generateMastroViaRest({

  userMessage,

  hotspots,

  systemPrompt,

  apiKey,

  modelName,

  conversationHistory,

}: MastroRestRequest): Promise<MastroChatResponse & { model: string }> {

  const url = `${GEMINI_REST_BASE}/${modelName}:generateContent`;



  const payload = {

    contents: buildRestContents(userMessage, conversationHistory),

    systemInstruction: {

      parts: [{ text: systemPrompt }],

    },

    generationConfig: {

      responseMimeType: "application/json",

      responseSchema: {

        type: "OBJECT",

        properties: {

          reply: {

            type: "STRING",

            description:

              "La risposta testuale amichevole e dettagliata in Markdown da mostrare all'utente.",

          },

          recommendedHotspotId: {

            type: "STRING",

            description:

              "L'ID univoco dell'hotspot raccomandato presente nella lista, oppure null.",

          },

        },

        required: ["reply", "recommendedHotspotId"],

      },

    },

  };



  const response = await fetchWithExponentialBackoff(url, {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      "x-goog-api-key": apiKey,

    },

    body: JSON.stringify(payload),

  });



  if (!response.ok) {

    const detail = await response.text();

    throw new Error(

      `Errore API Gemini: ${response.status} ${detail.slice(0, 200)}`

    );

  }



  const result = (await response.json()) as {

    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;

  };

  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;



  if (!rawText) {

    throw new Error("Risposta vuota ricevuta dal modello.");

  }



  const parsed = JSON.parse(rawText) as Partial<MastroChatResponse>;

  if (!parsed.reply || typeof parsed.reply !== "string") {

    throw new Error("JSON Mastro privo del campo reply");

  }



  const validIds = new Set(hotspots.map((h) => h.id));

  let recommendedHotspotId: string | null =

    parsed.recommendedHotspotId === null ||

    parsed.recommendedHotspotId === undefined ||

    parsed.recommendedHotspotId === "null"

      ? null

      : String(parsed.recommendedHotspotId);



  if (recommendedHotspotId && !validIds.has(recommendedHotspotId)) {

    recommendedHotspotId = null;

  }



  return {

    reply: parsed.reply.trim(),

    recommendedHotspotId,

    model: modelName,

  };

}



export const MASTRO_GEMINI_MODEL_FALLBACKS = [

  "gemini-2.5-flash",

  "gemini-2.5-flash-preview-09-2025",

  "gemini-2.0-flash",

] as const;


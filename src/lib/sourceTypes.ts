export type CertifiedSourceCategory =
  | "normativa"
  | "sanita"
  | "ambiente"
  | "parco"
  | "meteo"
  | "micologia"
  | "editoriale"
  | "youtube"
  | "internazionale"
  | "citizen-science"
  | "app";

export interface CertifiedSource {
  id: string;
  name: string;
  shortName: string;
  category: CertifiedSourceCategory;
  url: string;
  region?: string;
  country: string;
  description: string;
  certificationNote: string;
  topics: string[];
}

export const CATEGORY_LABELS: Record<CertifiedSourceCategory, string> = {
  normativa: "Normativa ufficiale",
  sanita: "Sanità / ASL / Micologo",
  ambiente: "Ambiente / ARPA / Foreste",
  parco: "Parchi e aree protette",
  meteo: "Meteo ufficiale",
  micologia: "Micologia / Università / Associazioni",
  editoriale: "Editoriale specialistico",
  youtube: "YouTube / video divulgativi",
  internazionale: "Internazionale / UE",
  "citizen-science": "Citizen science / osservazioni",
  app: "App mobile (riferimento)",
};

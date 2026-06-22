/**
 * YouTube — solo video/canali con URL verificati via oEmbed.
 * NON sono fonti ufficiali: livello "community" assegnato dall'algoritmo.
 * Nessun link di ricerca YouTube (non è una fonte).
 */
import type { CertifiedSource } from "./sourceTypes";

const IT = "Italia";

export const YOUTUBE_SOURCE_ENTRIES: Omit<CertifiedSource, "category">[] = [
  {
    id: "yt-calamini-giugno-2026",
    name: "FUNGHI PORCINI GIUGNO 2026 — La riscossa del castagno",
    shortName: "YT Calamini Giugno 2026",
    url: "https://www.youtube.com/watch?v=m1rqIqJdsQM",
    region: "Appennino",
    country: IT,
    description: "Video: Alessandro Calamini (@alessandrocalamini) — porcini sotto castagno.",
    certificationNote: "Verificare autore via oEmbed — fonte community, non ufficiale",
    topics: ["porcini", "castagno", "giugno", "video"],
  },
  {
    id: "yt-corbara-porcini-sannita-2022",
    name: "PORCINI 2022 — Faggeta 1400 m Appennino Sannita",
    shortName: "YT Corbara Sannita 2022",
    url: "https://www.youtube.com/watch?v=4itOIP40OqQ",
    region: "Sannio",
    country: IT,
    description: "Video: luca Corbara (@lucacorbarafunghi) — Sannio, faggeta d'altura.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "Sannio", "video"],
  },
  {
    id: "yt-corbara-porcini-sett-2022",
    name: "Porcini settembre 2022 — Faggete del Sannio",
    shortName: "YT Corbara Sett 2022",
    url: "https://www.youtube.com/watch?v=uhTCXQXSEMk",
    region: "Sannio",
    country: IT,
    description: "Video: luca Corbara (@lucacorbarafunghi) — bottata autunnale Sannio.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "Sannio", "settembre", "video"],
  },
  {
    id: "yt-oppicelli-porcini-giugno",
    name: "Porcini a giugno in Appennino: fra fossi e ripari",
    shortName: "YT Oppicelli Giugno",
    url: "https://www.youtube.com/watch?v=5D6-1C6JRaQ",
    region: "Appennino",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — B. aestivalis, microclima.",
    certificationNote: "Micologo divulgatore — fonte community educativa",
    topics: ["estatino", "giugno", "Appennino", "video"],
  },
  {
    id: "yt-oppicelli-porcini-giugno-faggeta",
    name: "Faggeta secca? I porcini di giugno nascono dove non guardi",
    shortName: "YT Oppicelli Faggeta Giugno",
    url: "https://www.youtube.com/watch?v=PZhhFUJq_RU",
    region: "Appennino",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — habitat faggeta e primi porcini.",
    certificationNote: "Verificare autore via oEmbed — fonte community educativa",
    topics: ["porcini", "faggio", "giugno", "Appennino", "video"],
  },
  {
    id: "yt-oppicelli-porcini-temporale-giugno",
    name: "Porcini di giugno — il temporale arriva: dove cercare Boletus aestivalis",
    shortName: "YT Oppicelli Temporale Giugno",
    url: "https://www.youtube.com/watch?v=23-etMMyI2M",
    region: "Appennino",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — post-temporale e estatini.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "estatino", "giugno", "Appennino", "video"],
  },
  {
    id: "yt-oppicelli-porcini-caldo-giugno",
    name: "I porcini di giugno — quando il caldo li spacca",
    shortName: "YT Oppicelli Caldo Giugno",
    url: "https://www.youtube.com/watch?v=l3zCbzwhnaE",
    region: "Appennino",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — stress termico e qualità raccolta.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "estate", "giugno", "Appennino", "video"],
  },
  {
    id: "yt-oppicelli-porcini-appennino-giugno",
    name: "Porcini in Appennino a giugno",
    shortName: "YT Oppicelli Appennino Giugno",
    url: "https://www.youtube.com/watch?v=ZDLG5Paa8as",
    region: "Appennino",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — uscite estive in Appennino.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "giugno", "Appennino", "video"],
  },
  {
    id: "yt-oppicelli-porcini-estivi-primavera",
    name: "I funghi porcini estivi in primavera",
    shortName: "YT Oppicelli Estatini Primavera",
    url: "https://www.youtube.com/watch?v=YD2aoITqVas",
    region: "Appennino",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — fenologia porcini estivi precoci.",
    certificationNote: "Verificare autore via oEmbed — fonte community educativa",
    topics: ["porcini", "estatino", "primavera", "video"],
  },
  {
    id: "yt-oppicelli-porcini-timelapse",
    name: "Porcini in timelapse — una settimana di crescita",
    shortName: "YT Oppicelli Timelapse",
    url: "https://www.youtube.com/watch?v=isqrAgLuBuw",
    country: IT,
    description: "Video: Nicolò Oppicelli (@nicolo.oppicelli) — crescita porcini in pochi secondi.",
    certificationNote: "Verificare autore via oEmbed — fonte community educativa",
    topics: ["porcini", "micologo", "video"],
  },
  {
    id: "yt-channel-calamini",
    name: "Canale YouTube — Alessandro Calamini (@alessandrocalamini)",
    shortName: "YT @alessandrocalamini",
    url: "https://www.youtube.com/@alessandrocalamini",
    country: IT,
    description: "Canale divulgativo porcini e habitat.",
    certificationNote: "Canale community — citare singoli video, non il canale generico",
    topics: ["porcini", "canale"],
  },
  {
    id: "yt-channel-corbara",
    name: "Canale YouTube — luca Corbara (@lucacorbarafunghi)",
    shortName: "YT @lucacorbarafunghi",
    url: "https://www.youtube.com/@lucacorbarafunghi",
    region: "Sannio",
    country: IT,
    description: "Canale divulgativo Sannio/Appennino sannita.",
    certificationNote: "Canale community — citare singoli video",
    topics: ["Sannio", "canale"],
  },
  {
    id: "yt-channel-oppicelli",
    name: "Canale YouTube — Nicolò Oppicelli (@nicolo.oppicelli)",
    shortName: "YT @nicolo.oppicelli",
    url: "https://www.youtube.com/@nicolo.oppicelli",
    country: IT,
    description: "Canale micologo divulgatore.",
    certificationNote: "Canale community educativo",
    topics: ["micologo", "canale"],
  },
  {
    id: "yt-fungonauta-porcini-giugno-2026",
    name: "Finalmente il Faggio — I Primi Porcini (Giugno 2026)",
    shortName: "YT Fungonauta Giugno 2026",
    url: "https://www.youtube.com/watch?v=YYNIu9fIdN8",
    region: "Appennino",
    country: IT,
    description: "Video: Il fungonauta (@ilfungonauta) — primi porcini sotto faggio.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "faggio", "giugno", "video"],
  },
  {
    id: "yt-fungonauta-porcini-2026",
    name: "Porcini 2026 — si inizia a fare sul serio",
    shortName: "YT Fungonauta Porcini 2026",
    url: "https://www.youtube.com/watch?v=wb0y4qSWloo",
    region: "Appennino",
    country: IT,
    description: "Video: Il fungonauta (@ilfungonauta) — stagione porcini 2026.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "video"],
  },
  {
    id: "yt-fungonauta-finferli",
    name: "Come trovare più finferli (Cantharellus pallens)",
    shortName: "YT Fungonauta Finferli",
    url: "https://www.youtube.com/watch?v=axaCelJr8Sc",
    country: IT,
    description: "Video: Il fungonauta (@ilfungonauta) — habitat e ricerca finferli.",
    certificationNote: "Verificare autore via oEmbed — fonte community educativa",
    topics: ["finferlo", "galletto", "habitat", "video"],
  },
  {
    id: "yt-fungonauta-porcini-larvati",
    name: "Porcini larvati in estate — perché succede e come valutarli",
    shortName: "YT Fungonauta Larvati",
    url: "https://www.youtube.com/watch?v=qQqj2sHS4G0",
    country: IT,
    description: "Video: Il fungonauta (@ilfungonauta) — qualità raccolta estiva.",
    certificationNote: "Verificare autore via oEmbed — fonte community",
    topics: ["porcini", "estate", "estatino", "video"],
  },
  {
    id: "yt-channel-fungonauta",
    name: "Canale YouTube — Il fungonauta (@ilfungonauta)",
    shortName: "YT @ilfungonauta",
    url: "https://www.youtube.com/@ilfungonauta",
    country: IT,
    description: "Canale divulgativo porcini, habitat e micologia pratica.",
    certificationNote: "Canale community — citare singoli video, non il canale generico",
    topics: ["porcini", "canale"],
  },
].map((e) => ({ ...e, category: "youtube" as const }));

export const YOUTUBE_SOURCE_COUNT = YOUTUBE_SOURCE_ENTRIES.length;

export const YOUTUBE_FEATURED_VIDEOS = YOUTUBE_SOURCE_ENTRIES.filter((s) =>
  s.url.includes("watch?v=")
);

export function formatYoutubeSourcesForGemini(
  verifiedVideos: Array<{ shortName: string; description: string; url: string; youtubeAuthor?: string }>,
  limit = 8
): string {
  return verifiedVideos
    .slice(0, limit)
    .map(
      (s) =>
        `- [YouTube community] ${s.shortName}${s.youtubeAuthor ? ` (${s.youtubeAuthor})` : ""}: ${s.description} (${s.url})`
    )
    .join("\n");
}

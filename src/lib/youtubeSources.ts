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

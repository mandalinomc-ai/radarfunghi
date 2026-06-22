/**
 * Motore certificazione fonti — nessuna etichetta "certificato" manuale.
 * Valuta: dominio ufficiale, URL raggiungibile, coerenza tematica, YouTube oEmbed.
 */

import type { CertifiedSource } from "./sourceTypes";

export type CertificationLevel =
  | "ufficiale"       // .gov.it, enti pubblici verificati
  | "istituzionale"   // università, CNR, parchi, ARPA raggiungibili
  | "editoriale"      // FM, AMB — verificabile, non governativo
  | "community"       // YouTube/blog — autore identificato, NON ufficiale
  | "non_verificato"  // URL non raggiungibile o dati insufficienti
  | "rimosso";        // non mostrare in UI

export interface SourceVerificationResult {
  sourceId: string;
  url: string;
  level: CertificationLevel;
  score: number; // 0-100
  urlReachable: boolean;
  httpStatus: number | null;
  officialDomain: boolean;
  crossRefMatches: string[];
  warnings: string[];
  verifiedAt: string;
  /** YouTube only */
  youtubeAuthor?: string;
  youtubeTitle?: string;
}

/** Domini considerati ufficiali (PA italiana / UE) */
const OFFICIAL_DOMAIN_PATTERNS: RegExp[] = [
  /\.gov\.it$/i,
  /\.gazzettaufficiale\.it$/i,
  /\.iss\.it$/i,
  /\.salute\.gov\.it$/i,
  /\.isprambiente\.gov\.it$/i,
  /\.protezionecivile\.gov\.it$/i,
  /\.carabinieri\.it$/i,
  /\.crea\.gov\.it$/i,
  /\.cnr\.it$/i,
  /\.meteoam\.it$/i,
  /\.europa\.eu$/i,
  /\.ecmwf\.int$/i,
  /regione\.campania\.it$/i,
  /regione\.molise\.it$/i,
  /regione\.basilicata\.it$/i,
  /funghietartufi\.regione\.campania\.it$/i,
  /^asl[a-z0-9.-]+\.it$/i,
  /^aspbasilicata\.it$/i,
  /^asrem\.molise\.it$/i,
];

/** Domini istituzionali (non PA strict ma enti riconoscibili) */
const INSTITUTIONAL_DOMAIN_PATTERNS: RegExp[] = [
  /^arp[a-z.]*\.it$/i,
  /parco[a-z.-]*\.it$/i,
  /parc[a-z.-]*\.it$/i,
  /cilentoediano\.it$/i,
  /enteparcotaburnocamposauro\.it$/i,
  /comunitamontana[a-z.-]*\.it$/i,
  /^uni[a-z0-9.-]+\.it$/i,
  /unina\.it$/i,
  /unimol\.it$/i,
  /unibas\.it$/i,
  /ambbresadola\.it$/i,
  /amint\.it$/i,
  /unionemicologicaitaliana-aps\.it$/i,
  /mushroomobserver\.org$/i,
  /inaturalist\.org$/i,
  /igmi\.org$/i,
  /indexfungorum\.org$/i,
  /open-meteo\.com$/i,
  /openstreetmap\.org$/i,
];

const EDITORIAL_DOMAIN_PATTERNS: RegExp[] = [
  /funghimagazine\.it$/i,
  /first-nature\.com$/i,
  /blogspot\.com$/i,
];

const YOUTUBE_HOST = /^(www\.)?youtube\.com$/i;

export function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isOfficialDomain(hostname: string): boolean {
  return OFFICIAL_DOMAIN_PATTERNS.some((re) => re.test(hostname));
}

export function isInstitutionalDomain(hostname: string): boolean {
  return INSTITUTIONAL_DOMAIN_PATTERNS.some((re) => re.test(hostname));
}

export function isEditorialDomain(hostname: string): boolean {
  return EDITORIAL_DOMAIN_PATTERNS.some((re) => re.test(hostname));
}

export function isYoutubeUrl(url: string): boolean {
  const h = extractHostname(url);
  return h ? YOUTUBE_HOST.test(h) : false;
}

/** Incrocio tematico: argomento fonte vs domini/enti attesi */
export function crossReferenceTopics(source: CertifiedSource): string[] {
  const matches: string[] = [];
  const host = extractHostname(source.url);
  if (!host) return matches;

  const topicStr = [...source.topics, source.region ?? "", source.name]
    .join(" ")
    .toLowerCase();

  if (topicStr.includes("campania") && host.includes("campania")) {
    matches.push("dominio_coerente_campania");
  }
  if (topicStr.includes("molise") && (host.includes("molise") || host.includes("asrem"))) {
    matches.push("dominio_coerente_molise");
  }
  if (topicStr.includes("basilicata") && (host.includes("basilicata") || host.includes("arpab"))) {
    matches.push("dominio_coerente_basilicata");
  }
  if (topicStr.includes("sannio") && (host.includes("benevento") || host.includes("campania"))) {
    matches.push("coerenza_territoriale_sannio");
  }
  if (topicStr.includes("taburno") && host.includes("taburno")) {
    matches.push("coerenza_parco_taburno");
  }
  if (topicStr.includes("matese") && host.includes("matese")) {
    matches.push("coerenza_parco_matese");
  }
  if (topicStr.includes("pollino") && host.includes("pollino")) {
    matches.push("coerenza_parco_pollino");
  }
  if (source.category === "normativa" && isOfficialDomain(host)) {
    matches.push("normativa_su_dominio_pa");
  }
  if (source.category === "sanita" && (isOfficialDomain(host) || host.includes("iss") || host.includes("asl"))) {
    matches.push("sanita_su_dominio_pa");
  }

  return matches;
}

export function scoreCertification(input: {
  source: CertifiedSource;
  urlReachable: boolean;
  httpStatus: number | null;
  youtubeMeta?: { author?: string; title?: string };
}): Omit<SourceVerificationResult, "sourceId" | "url" | "verifiedAt"> {
  const { source, urlReachable, httpStatus, youtubeMeta } = input;
  const host = extractHostname(source.url);
  const warnings: string[] = [];
  const crossRefMatches = crossReferenceTopics(source);

  if (!urlReachable) {
    return {
      level: "non_verificato",
      score: 0,
      urlReachable: false,
      httpStatus,
      officialDomain: false,
      crossRefMatches,
      warnings: ["URL non raggiungibile — fonte esclusa dal catalogo attivo"],
    };
  }

  if (!host) {
    return {
      level: "non_verificato",
      score: 0,
      urlReachable: true,
      httpStatus,
      officialDomain: false,
      crossRefMatches,
      warnings: ["URL malformato"],
    };
  }

  // YouTube: mai "ufficiale" salvo canali PA (raro)
  if (isYoutubeUrl(source.url)) {
    const hasVideo = source.url.includes("watch?v=");
    const hasAuthor = Boolean(youtubeMeta?.author);
    if (!hasVideo) {
      warnings.push("Canale YouTube — citare singoli video, non il canale generico");
    }
    if (!hasAuthor && hasVideo) {
      warnings.push("Autore YouTube non verificato via oEmbed");
    }
    if (isOfficialDomain(host)) {
      return {
        level: "ufficiale",
        score: 90,
        urlReachable: true,
        httpStatus,
        officialDomain: true,
        crossRefMatches,
        warnings,
        youtubeAuthor: youtubeMeta?.author,
        youtubeTitle: youtubeMeta?.title,
      };
    }
    return {
      level: "community",
      score: hasAuthor ? 55 + crossRefMatches.length * 5 : 35,
      urlReachable: true,
      httpStatus,
      officialDomain: false,
      crossRefMatches,
      warnings: [
        ...warnings,
        "YouTube divulgativo — NON sostituisce ASL/micologo o enti ufficiali",
      ],
      youtubeAuthor: youtubeMeta?.author,
      youtubeTitle: youtubeMeta?.title,
    };
  }

  let score = 40;
  let level: CertificationLevel = "non_verificato";

  if (isOfficialDomain(host)) {
    level = "ufficiale";
    score = 85 + crossRefMatches.length * 3;
  } else if (isInstitutionalDomain(host)) {
    level = "istituzionale";
    score = 70 + crossRefMatches.length * 3;
  } else if (isEditorialDomain(host)) {
    level = "editoriale";
    score = 60 + crossRefMatches.length * 2;
  } else {
    warnings.push("Dominio non riconosciuto nel registro ufficiali/istituzionali");
    level = "non_verificato";
    score = 25;
  }

  // Penalità se categoria vs dominio incoerenti
  if (source.category === "normativa" && !isOfficialDomain(host)) {
    warnings.push("Normativa su dominio non PA — verificare manualmente");
    score -= 20;
    level = "non_verificato";
  }
  if (source.category === "parco" && !isInstitutionalDomain(host) && !isOfficialDomain(host)) {
    warnings.push("Parco su dominio non istituzionale");
    score -= 15;
  }

  // Link ricerca YouTube — non sono fonti
  if (source.url.includes("search_query=")) {
    return {
      level: "non_verificato",
      score: 0,
      urlReachable: true,
      httpStatus,
      officialDomain: false,
      crossRefMatches,
      warnings: ["Link di ricerca — non è una fonte verificabile"],
    };
  }

  score = Math.min(100, Math.max(0, score));

  return {
    level,
    score,
    urlReachable: true,
    httpStatus,
    officialDomain: isOfficialDomain(host),
    crossRefMatches,
    warnings,
  };
}

export async function verifySourceUrl(
  source: CertifiedSource
): Promise<SourceVerificationResult> {
  const verifiedAt = new Date().toISOString();

  if (isYoutubeUrl(source.url) && source.url.includes("watch?v=")) {
    try {
      const oembed = `https://noembed.com/embed?url=${encodeURIComponent(source.url)}`;
      const res = await fetch(oembed, { signal: AbortSignal.timeout(10000) });
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        error?: string;
      };
      const ok = Boolean(data.title && data.author_name && !data.error);
      const scored = scoreCertification({
        source,
        urlReachable: ok,
        httpStatus: ok ? 200 : 0,
        youtubeMeta: { author: data.author_name, title: data.title },
      });
      return { sourceId: source.id, url: source.url, verifiedAt, ...scored };
    } catch {
      const scored = scoreCertification({
        source,
        urlReachable: false,
        httpStatus: 0,
      });
      return { sourceId: source.id, url: source.url, verifiedAt, ...scored };
    }
  }

  try {
    let res = await fetch(source.url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent":
          "MushroomRadar-SourceVerifier/1.0 (+https://radar-funghi.vercel.app)",
      },
    });
    if (res.status === 405 || res.status === 403 || res.status === 501 || res.status === 404) {
      res = await fetch(source.url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
        headers: {
          "User-Agent":
            "MushroomRadar-SourceVerifier/1.0 (+https://radar-funghi.vercel.app)",
        },
      });
    }
    const reachable = res.status >= 200 && res.status < 400;
    const scored = scoreCertification({
      source,
      urlReachable: reachable,
      httpStatus: res.status,
    });
    return { sourceId: source.id, url: source.url, verifiedAt, ...scored };
  } catch {
    const scored = scoreCertification({
      source,
      urlReachable: false,
      httpStatus: 0,
    });
    return { sourceId: source.id, url: source.url, verifiedAt, ...scored };
  }
}

export async function verifyAllSources(
  sources: CertifiedSource[]
): Promise<SourceVerificationResult[]> {
  const results: SourceVerificationResult[] = [];
  const BATCH = 5;
  for (let i = 0; i < sources.length; i += BATCH) {
    const batch = sources.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(verifySourceUrl));
    results.push(...batchResults);
  }
  return results;
}

/** Fonti utilizzabili da Mastro / UI — solo verificate e non community-search */
export function filterActiveSources(
  sources: CertifiedSource[],
  verifications: SourceVerificationResult[]
): CertifiedSource[] {
  const byId = new Map(verifications.map((v) => [v.sourceId, v]));
  return sources.filter((s) => {
    const v = byId.get(s.id);
    if (!v) return false;
    if (!v.urlReachable) return false;
    if (v.level === "non_verificato" || v.level === "rimosso") return false;
    if (s.url.includes("search_query=")) return false;
    return true;
  });
}

export function filterOfficialSources(
  verifications: SourceVerificationResult[]
): SourceVerificationResult[] {
  return verifications.filter(
    (v) => v.level === "ufficiale" || v.level === "istituzionale"
  );
}

export const LEVEL_LABELS: Record<CertificationLevel, string> = {
  ufficiale: "Ufficiale PA",
  istituzionale: "Istituzionale verificato",
  editoriale: "Editoriale verificato",
  community: "Community / YouTube",
  non_verificato: "Non verificato",
  rimosso: "Rimosso",
};

export const LEVEL_COLORS: Record<CertificationLevel, string> = {
  ufficiale: "text-green-400",
  istituzionale: "text-emerald-400",
  editoriale: "text-mushroom-300",
  community: "text-yellow-400",
  non_verificato: "text-red-400",
  rimosso: "text-forest-600",
};

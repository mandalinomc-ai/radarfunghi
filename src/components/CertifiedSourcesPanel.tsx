"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CERTIFIED_SOURCES,
  CATALOG_META,
  CATEGORY_LABELS,
  type CertifiedSourceCategory,
  searchCertifiedSources,
} from "@/lib/certifiedSources";
import {
  LEVEL_LABELS,
  LEVEL_COLORS,
  type CertificationLevel,
  type SourceVerificationResult,
} from "@/lib/sourceCertificationEngine";
import { VERIFIED_COORDS_LAST_REVIEW } from "@/lib/verifiedZoneCoords";

const CATEGORY_ORDER: CertifiedSourceCategory[] = [
  "normativa",
  "sanita",
  "ambiente",
  "parco",
  "meteo",
  "micologia",
  "editoriale",
  "youtube",
  "internazionale",
];

interface VerifyResponse {
  activeCount: number;
  total: number;
  brokenCount: number;
  cacheAgeMinutes: number | null;
  verifications: SourceVerificationResult[];
  activeSourceIds: string[];
}

export default function CertifiedSourcesPanel() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CertifiedSourceCategory | "all">("all");
  const [levelFilter, setLevelFilter] = useState<CertificationLevel | "all">(
    "all"
  );
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVerifications = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sources/verify${force ? "?force=1" : ""}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Verifica fonti fallita");
      setVerifyData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore verifica");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications(false);
  }, []);

  const verificationMap = useMemo(() => {
    const map = new Map<string, SourceVerificationResult>();
    for (const v of verifyData?.verifications ?? []) {
      map.set(v.sourceId, v);
    }
    return map;
  }, [verifyData]);

  const filtered = useMemo(() => {
    let list = searchCertifiedSources(query);
    if (filter !== "all") {
      list = list.filter((s) => s.category === filter);
    }
    if (levelFilter !== "all") {
      list = list.filter(
        (s) => verificationMap.get(s.id)?.level === levelFilter
      );
    }
    // Mostra prima le verificate, nascondi non_verificato di default
    return list.sort((a, b) => {
      const va = verificationMap.get(a.id);
      const vb = verificationMap.get(b.id);
      if (va?.urlReachable && !vb?.urlReachable) return -1;
      if (!va?.urlReachable && vb?.urlReachable) return 1;
      return (vb?.score ?? 0) - (va?.score ?? 0);
    });
  }, [query, filter, levelFilter, verificationMap]);

  const counts = useMemo(() => {
    const map = new Map<CertifiedSourceCategory, number>();
    for (const s of CERTIFIED_SOURCES) {
      const v = verificationMap.get(s.id);
      if (v && v.urlReachable && v.level !== "non_verificato") {
        map.set(s.category, (map.get(s.category) ?? 0) + 1);
      }
    }
    return map;
  }, [verificationMap]);

  const activeCount = verifyData?.activeCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-mushroom-900/20 border border-mushroom-500/30 px-3 py-2.5">
        <p className="text-sm font-semibold text-mushroom-300">
          {loading
            ? "Verifica fonti in corso..."
            : `${activeCount} fonti verificate attive`}
        </p>
        <p className="text-[11px] text-forest-400 mt-1 leading-relaxed">
          Certificazione <strong>algoritmica</strong>: dominio PA/istituzionale,
          URL raggiungibile, oEmbed YouTube, incrocio tematico. Nessuna etichetta
          manuale.
        </p>
        {!loading && verifyData && (
          <p className="text-[10px] text-forest-500 mt-1">
            {verifyData.brokenCount} URL non raggiungibili esclusi · cache{" "}
            {verifyData.cacheAgeMinutes ?? 0} min · catalogo v{CATALOG_META.version}
          </p>
        )}
        {error && (
          <p className="text-[10px] text-red-400 mt-1">{error}</p>
        )}
        <button
          type="button"
          onClick={() => loadVerifications(true)}
          disabled={loading}
          className="mt-2 text-[10px] px-2 py-1 rounded bg-forest-800 text-forest-300 disabled:opacity-50"
        >
          {loading ? "Verifica..." : "Riverifica URL ora"}
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca fonte, regione, argomento..."
        className="w-full px-3 py-2 rounded-lg bg-forest-950 border border-forest-600/50 text-sm text-forest-100 placeholder:text-forest-500"
      />

      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Tutte (${activeCount})`}
        />
        {CATEGORY_ORDER.map((cat) => {
          const n = counts.get(cat) ?? 0;
          if (n === 0) return null;
          return (
            <FilterChip
              key={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
              label={`${CATEGORY_LABELS[cat]} (${n})`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            "all",
            "ufficiale",
            "istituzionale",
            "editoriale",
            "community",
          ] as const
        ).map((lvl) => (
          <FilterChip
            key={lvl}
            active={levelFilter === lvl}
            onClick={() => setLevelFilter(lvl)}
            label={
              lvl === "all"
                ? "Tutti i livelli"
                : LEVEL_LABELS[lvl as CertificationLevel]
            }
          />
        ))}
      </div>

      <p className="text-[10px] text-forest-500">{filtered.length} risultati</p>

      <div className="space-y-2 max-h-[55dvh] overflow-y-auto overscroll-contain pr-1">
        {filtered.map((source) => {
          const v = verificationMap.get(source.id);
          return (
            <SourceCard key={source.id} source={source} verification={v} />
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[9px] px-2 py-1 rounded-full border touch-manipulation ${
        active
          ? "bg-mushroom-600/40 border-mushroom-500/50 text-mushroom-100"
          : "bg-forest-800 border-forest-700/50 text-forest-400"
      }`}
    >
      {label}
    </button>
  );
}

function SourceCard({
  source,
  verification,
}: {
  source: (typeof CERTIFIED_SOURCES)[number];
  verification?: SourceVerificationResult;
}) {
  const reachable = verification?.urlReachable ?? false;
  const level = verification?.level ?? "non_verificato";
  const levelClass = LEVEL_COLORS[level];

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-forest-100 leading-snug">
            {source.shortName}
          </p>
          <p className="text-[10px] text-mushroom-400/90 mt-0.5">
            {CATEGORY_LABELS[source.category]}
            {source.region ? ` · ${source.region}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded font-medium ${levelClass} bg-forest-950/80 border border-forest-700/40`}
        >
          {LEVEL_LABELS[level]}
        </span>
      </div>
      <p className="text-[10px] text-forest-400 mt-1.5 leading-snug">
        {source.description}
      </p>
      {verification?.youtubeAuthor && (
        <p className="text-[9px] text-yellow-400/90 mt-1">
          YouTube: {verification.youtubeAuthor}
          {verification.youtubeTitle
            ? ` — «${verification.youtubeTitle.slice(0, 60)}»`
            : ""}
        </p>
      )}
      {verification?.warnings && verification.warnings.length > 0 && (
        <p className="text-[9px] text-forest-500 mt-1 italic">
          {verification.warnings[0]}
        </p>
      )}
      {!reachable && (
        <p className="text-[9px] text-red-400 mt-1">
          URL non raggiungibile — link disabilitato
        </p>
      )}
      <p className="text-[9px] text-forest-600 mt-1 truncate">{source.url}</p>
    </>
  );

  if (!reachable) {
    return (
      <div className="block p-3 rounded-xl bg-forest-950/40 border border-red-900/30 opacity-60">
        {inner}
      </div>
    );
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-xl bg-forest-950/60 border border-forest-700/40 hover:border-mushroom-500/40 transition-colors"
    >
      {inner}
    </a>
  );
}

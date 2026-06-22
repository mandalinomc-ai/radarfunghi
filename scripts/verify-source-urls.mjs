/**
 * Verifica HTTP di tutte le URL nel catalogo fonti.
 * Uso: node scripts/verify-source-urls.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Import compiled sources via dynamic eval of TS exports — parse URLs from file instead
function extractSources() {
  const certified = readFileSync(
    join(root, "src/lib/sourceRegistry.ts"),
    "utf8"
  );
  const youtube = readFileSync(join(root, "src/lib/youtubeSources.ts"), "utf8");

  const entries = [];
  for (const text of [certified, youtube]) {
    let m;
    const localRe =
      /id:\s*"([^"]+)"[\s\S]*?shortName:\s*"([^"]+)"[\s\S]*?url:\s*"([^"]+)"/g;
    while ((m = localRe.exec(text)) !== null) {
      entries.push({ id: m[1], shortName: m[2], url: m[3] });
    }
  }

  // Dedupe by id
  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

async function checkUrl(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // HEAD first, fallback GET
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "MushroomRadar-SourceVerifier/1.0 (+https://radar-funghi.vercel.app)",
      },
    });
    if (res.status === 405 || res.status === 403 || res.status === 501 || res.status === 404) {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "MushroomRadar-SourceVerifier/1.0 (+https://radar-funghi.vercel.app)",
        },
      });
    }
    clearTimeout(timer);
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      finalUrl: res.url,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkYoutubeOembed(url) {
  try {
    const oembed = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembed, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, reason: "oembed fail" };
    const data = await res.json();
    if (data.error) return { ok: false, reason: data.error };
    return {
      ok: Boolean(data.title && data.author_name),
      title: data.title,
      author: data.author_name,
      authorUrl: data.author_url,
    };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

const entries = extractSources();
console.log(`Verifica ${entries.length} URL...\n`);

const results = [];
const BATCH = 6;

for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH);
  const checked = await Promise.all(
    batch.map(async (entry) => {
      const isYoutube = entry.url.includes("youtube.com");
      const isSearch = entry.url.includes("results?search_query");

      if (isYoutube && entry.url.includes("watch?v=")) {
        const yt = await checkYoutubeOembed(entry.url);
        return { ...entry, ...yt, method: "youtube-oembed" };
      }

      if (isSearch) {
        return {
          ...entry,
          ok: true,
          status: "search-link",
          method: "youtube-search",
          note: "Link ricerca — non verificabile come pagina singola",
        };
      }

      const http = await checkUrl(entry.url);
      return { ...entry, ...http, method: "http" };
    })
  );
  results.push(...checked);
  process.stdout.write(`\r${Math.min(i + BATCH, entries.length)}/${entries.length}`);
}

console.log("\n");

const broken = results.filter((r) => !r.ok);
const ok = results.filter((r) => r.ok);

console.log(`OK: ${ok.length} | NON OK: ${broken.length}\n`);

if (broken.length) {
  console.log("=== URL NON FUNZIONANTI ===");
  for (const r of broken) {
    console.log(`[${r.status ?? r.reason}] ${r.id}`);
    console.log(`  ${r.shortName}`);
    console.log(`  ${r.url}`);
    if (r.error) console.log(`  err: ${r.error}`);
    console.log("");
  }
}

const outPath = join(root, "scripts/source-url-report.json");
writeFileSync(outPath, JSON.stringify({ checkedAt: new Date().toISOString(), ok, broken }, null, 2));
console.log(`Report: ${outPath}`);

if (broken.length > 0) process.exit(1);

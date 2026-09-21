/**
 * Build reverse-fact.json from Jeopardy-style clue/response pairs.
 * Primary: OpenTriviaQA (CC BY-SA 4.0) — clues already use "This/He/She..." format.
 * Supplement: jservice.io when reachable (cached, not redistributed).
 *
 * Run: pnpm harvest-jeopardy
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReverseFactsFromJeopardy,
  filterRepetitiveTruths,
  isSpicyContent,
  isValidReverseFactPair,
  type JeopardyClueRow,
} from "../packages/shared/src/content-quality.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "packages/shared/content");
const CACHE = join(ROOT, "scripts/.cache");

const OPEN_TRIVIA_QA_BASE =
  "https://raw.githubusercontent.com/uberspot/OpenTriviaQA/master/categories";

const QA_SLUGS = [
  "for-kids",
  "general",
  "entertainment",
  "geography",
  "sports",
  "movies",
  "music",
  "television",
  "animals",
  "hobbies",
  "people",
  "world",
  "literature",
  "science-technology",
  "history",
  "video-games",
  "humanities",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeJson(rel: string, data: unknown) {
  const path = join(CONTENT, rel);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`  wrote ${rel} (${Array.isArray(data) ? data.length : "object"} items)`);
}

function parseOpenTriviaQAClues(text: string): JeopardyClueRow[] {
  const rows: JeopardyClueRow[] = [];
  const blocks = text.split(/\n(?=#Q)/);
  for (const block of blocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (!lines[0]?.startsWith("#Q")) continue;
    const clue = lines[0].replace(/^#Q\s*/, "").trim();
    const marker = lines.find((l) => l.startsWith("^"));
    if (!marker) continue;
    const response = marker.replace(/^\^\s*/, "").trim();
    if (!clue || !response) continue;
    rows.push({ clue, response });
  }
  return rows;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "PartyGames-jeopardy-harvest/1.0" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function fetchOpenTriviaQA(): Promise<JeopardyClueRow[]> {
  const out: JeopardyClueRow[] = [];
  const seen = new Set<string>();
  for (const slug of QA_SLUGS) {
    try {
      const text = await fetchText(`${OPEN_TRIVIA_QA_BASE}/${slug}`);
      for (const row of parseOpenTriviaQAClues(text)) {
        const key = `${row.clue}|${row.response}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
      }
      console.log(`  OpenTriviaQA/${slug}: +${parseOpenTriviaQAClues(text).length}`);
      await sleep(150);
    } catch (e) {
      console.warn(`  OpenTriviaQA/${slug} failed:`, e);
    }
  }
  return out;
}

type JServiceClue = { question?: string; answer?: string };

async function fetchJServiceBatch(count: number): Promise<JeopardyClueRow[]> {
  const res = await fetch(`https://jservice.io/api/random?count=${count}`, {
    headers: { "User-Agent": "PartyGames-jeopardy-harvest/1.0" },
  });
  if (!res.ok) throw new Error(`jservice ${res.status}`);
  const json = (await res.json()) as JServiceClue[];
  return json
    .filter((r) => r.question && r.answer)
    .map((r) => ({ clue: r.question!.trim(), response: r.answer!.trim() }));
}

async function fetchJServiceCached(target: number): Promise<JeopardyClueRow[]> {
  mkdirSync(CACHE, { recursive: true });
  const cachePath = join(CACHE, "jeopardy-jservice.json");
  let cached: JeopardyClueRow[] = existsSync(cachePath)
    ? (JSON.parse(readFileSync(cachePath, "utf8")) as JeopardyClueRow[])
    : [];
  const seen = new Set(cached.map((r) => `${r.clue}|${r.response}`.toLowerCase()));

  if (cached.length >= target) {
    console.log(`  jservice cache: ${cached.length} clues`);
    return cached;
  }

  let misses = 0;
  while (cached.length < target && misses < 12) {
    try {
      const batch = await fetchJServiceBatch(100);
      let added = 0;
      for (const row of batch) {
        const key = `${row.clue}|${row.response}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cached.push(row);
        added++;
      }
      if (added === 0) misses++;
      else misses = 0;
      await sleep(300);
    } catch (e) {
      console.warn("  jservice batch failed:", e);
      misses++;
      await sleep(1000);
    }
  }
  writeFileSync(cachePath, JSON.stringify(cached, null, 2));
  console.log(`  jservice: ${cached.length} clues cached`);
  return cached;
}

async function main() {
  console.log("Harvesting Jeopardy-style reverse-fact pairs…");
  const oaRows = await fetchOpenTriviaQA();
  let jserviceRows: JeopardyClueRow[] = [];
  try {
    jserviceRows = await fetchJServiceCached(8000);
  } catch (e) {
    console.warn("  jservice unavailable:", e);
  }

  const merged = [...oaRows, ...jserviceRows];
  const familyBuilt = buildReverseFactsFromJeopardy(merged, "family");
  const matureBuilt = buildReverseFactsFromJeopardy(merged, "mature");
  const filtered = filterRepetitiveTruths(
    [...familyBuilt, ...matureBuilt].filter((row) => isValidReverseFactPair(row.fact, row.truth)),
  );

  const seenFact = new Set<string>();
  const deduped = filtered.filter((row) => {
    const k = `${row.rating}|${row.fact}`.toLowerCase();
    if (seenFact.has(k)) return false;
    seenFact.add(k);
    return true;
  });

  const familyCount = deduped.filter((r) => r.rating === "family").length;
  const matureCount = deduped.filter((r) => r.rating === "mature").length;
  const matureSpicy = deduped.filter(
    (r) => r.rating === "mature" && isSpicyContent(`${r.fact} ${r.truth}`),
  ).length;

  if (familyCount < 200) {
    console.warn(`  reverse-fact family pool only ${familyCount} entries (target 200+)`);
  }
  if (matureCount < 50) {
    console.warn(`  reverse-fact mature pool only ${matureCount} entries (curated harvest adds more)`);
  } else {
    console.log(
      `  reverse-fact: ${deduped.length} entries (family ${familyCount}, mature ${matureCount}, mature spicy ${matureSpicy})`,
    );
  }

  writeJson("prompts/reverse-fact.json", deduped);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

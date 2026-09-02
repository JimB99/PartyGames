/**
 * Content audit: ratings, duplicates, pool sizes, family/mature splits, orphans.
 * Run: pnpm test:content
 * Strict 200+ family / 50+ mature (exit 1 on thin pools): pnpm test:content -- --strict-pools
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "packages/shared/content");
const STRICT_POOLS = process.argv.includes("--strict-pools");

const MATURE_PATTERNS = [
  /\bporn\s*star\b/i,
  /\bpornstar\b/i,
  /\bnsfw\b/i,
  /\bnude\b/i,
  /\berotic\b/i,
  /\bstripper\b/i,
  /\bprostitut/i,
  /\bhentai\b/i,
  /\bhad sex\b/i,
  /\bsex tape\b/i,
];

const MIN_POOL_SIZE = 200;
const MIN_FAMILY = 200;
const MIN_MATURE = 50;

const REGISTERED_CONTENT_FILES = new Set([
  "prompts/fact-check.json",
  "prompts/reverse-fact.json",
  "prompts/wit-showdown.json",
  "prompts/caption.json",
  "prompts/hot-seat.json",
  "prompts/split-room.json",
  "prompts/spectrum.json",
  "prompts/crowd-call.json",
  "trivia/quiz.json",
  "trivia/timeline.json",
  "would-you-rather.json",
  "words/draw.json",
  "words/charades.json",
  "words/charades-mature-extra.json",
  "words/forbidden-clue.json",
  "words/dictionary.json",
  "categories/impostor.json",
  "categories/friend-sort-roles.json",
  "categories/bracket.json",
]);

interface AuditIssue {
  severity: "error" | "warning";
  file: string;
  id?: string;
  message: string;
}

interface PoolStats {
  file: string;
  total: number;
  family: number;
  mature: number;
  unrated: number;
}

function walkJson(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJson(p));
    else if (entry.name.endsWith(".json")) out.push(p);
  }
  return out;
}

function isMatureText(text: string): boolean {
  const lower = text.toLowerCase();
  if (/\bsuper bowl xxx\b/i.test(text)) return false;
  if (MATURE_PATTERNS.some((re) => re.test(text))) return true;
  if (/\bhave sex\b/i.test(text)) return true;
  if (/\bpornstar\b/i.test(lower)) return true;
  return false;
}

function rel(path: string): string {
  return relative(CONTENT_DIR, path).replace(/\\/g, "/");
}

function asEntries(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>) : { value: e }));
  }
  if (data && typeof data === "object") return [data as Record<string, unknown>];
  return [];
}

/** Category files store items[] per pack — count playable items, not pack wrappers. */
function flattenPlayableEntries(entries: Record<string, unknown>[]): Record<string, unknown>[] {
  const withItems = entries.filter((e) => Array.isArray(e.items));
  if (withItems.length === 0 || withItems.length !== entries.length) return entries;
  return withItems.flatMap((e) =>
    (e.items as unknown[]).map((item) =>
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : { value: item, rating: e.rating ?? "family" },
    ),
  );
}

function entryText(rec: Record<string, unknown>): string {
  return String(rec.id ?? rec.text ?? rec.prompt ?? rec.word ?? rec.truth ?? rec.a ?? rec.left ?? rec.name ?? rec.event ?? JSON.stringify(rec));
}

function auditFile(path: string, statsOut: PoolStats[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    issues.push({ severity: "error", file: path, message: "Invalid JSON" });
    return issues;
  }

  const entries = flattenPlayableEntries(asEntries(data));
  const texts = new Set<string>();
  const matureExtra = /mature-extra/i.test(rel(path));
  const isDictionary = rel(path) === "words/dictionary.json";
  let family = 0;
  let mature = 0;
  let unrated = 0;

  for (const rec of entries) {
    const id = entryText(rec);
    const hasRating = rec.rating !== undefined;
    const rating = String(rec.rating ?? "family");
    const blob = JSON.stringify(rec);

    if (!hasRating) unrated++;
    else if (rating === "mature") mature++;
    else family++;

    if (rating === "family" && isMatureText(blob)) {
      issues.push({
        severity: "error",
        file: path,
        id,
        message: "Family-rated entry contains mature keywords",
      });
    }

    const normalized = blob.toLowerCase().replace(/\s+/g, " ").trim();
    if (texts.has(normalized)) {
      issues.push({ severity: "warning", file: path, id, message: "Duplicate content detected" });
    }
    texts.add(normalized);
  }

  if (!Array.isArray(data)) {
    family = 0;
    mature = 0;
    unrated = 0;
  } else if (unrated === entries.length) {
    family = entries.length;
    unrated = 0;
  } else {
    family += unrated;
    unrated = 0;
  }

  const fileRel = rel(path);
  statsOut.push({ file: fileRel, total: entries.length, family, mature, unrated });

  const thinSeverity = STRICT_POOLS ? "error" : "warning";
  if (entries.length < MIN_POOL_SIZE) {
    issues.push({
      severity: thinSeverity,
      file: path,
      message: `Pool has only ${entries.length} entries (min ${MIN_POOL_SIZE})`,
    });
  }
  if (family < MIN_FAMILY && entries.length > 0 && !matureExtra) {
    issues.push({
      severity: thinSeverity,
      file: path,
      message: `Family split has ${family} entries (min ${MIN_FAMILY})`,
    });
  }
  if (mature < MIN_MATURE && entries.length >= MIN_POOL_SIZE && !isDictionary && !matureExtra) {
    issues.push({
      severity: "warning",
      file: path,
      message: `Mature split has ${mature} entries (target ${MIN_MATURE}+ when pool is large)`,
    });
  }

  if (!REGISTERED_CONTENT_FILES.has(fileRel) && fileRel !== "words/dictionary.json") {
    issues.push({
      severity: "warning",
      file: path,
      message: "Orphan content: JSON is not wired to a registered game pool",
    });
  }

  return issues;
}

function main() {
  const files = walkJson(CONTENT_DIR);
  const issues: AuditIssue[] = [];
  const stats: PoolStats[] = [];
  for (const file of files) {
    issues.push(...auditFile(file, stats));
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  console.log("Content inventory (family / mature / total)");
  for (const s of stats.sort((a, b) => a.file.localeCompare(b.file))) {
    const flag = s.total < MIN_POOL_SIZE || s.family < MIN_FAMILY ? " THIN" : "";
    console.log(`  ${s.file}: family=${s.family} mature=${s.mature} total=${s.total}${flag}`);
  }

  console.log(`\nContent audit: ${errors.length} error(s), ${warnings.length} warning(s)${STRICT_POOLS ? " [strict-pools]" : ""}`);
  for (const issue of issues) {
    console.log(`  [${issue.severity}] ${issue.file}${issue.id ? ` (${issue.id})` : ""}: ${issue.message}`);
  }

  if (errors.length > 0) process.exit(1);
}

main();

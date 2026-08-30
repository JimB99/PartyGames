/**
 * Full PartyGames test orchestration + report.
 * Run: pnpm test:games
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "test-reports");

interface StepResult {
  name: string;
  command: string;
  ok: boolean;
  output: string;
}

function runStep(name: string, command: string): StepResult {
  console.log(`\n=== ${name} ===\n> ${command}\n`);
  try {
    const output = execSync(command, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
    return { name, command, ok: true, output };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    const output = [e.stdout ?? "", e.stderr ?? "", e.message ?? ""].filter(Boolean).join("\n");
    return { name, command, ok: false, output };
  }
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function buildReport(steps: StepResult[]): string {
  const auditPath = join(REPORT_DIR, "coverage-audit.json");
  let auditSection = "_No coverage audit file generated._\n";
  if (existsSync(auditPath)) {
    const audit = JSON.parse(readFileSync(auditPath, "utf8")) as {
      gapCount: number;
      gaps: Array<{ gameId: string; dimension: string; suggestion: string }>;
    };
    auditSection = `**Gaps found:** ${audit.gapCount}\n\n`;
    if (audit.gaps.length > 0) {
      auditSection += "| Game | Dimension | Suggestion |\n|------|-----------|------------|\n";
      for (const gap of audit.gaps) {
        auditSection += `| ${gap.gameId} | ${gap.dimension} | ${gap.suggestion} |\n`;
      }
    } else {
      auditSection += "All required coverage dimensions satisfied.\n";
    }
  }

  const failures = steps.filter((s) => !s.ok);
  let failureSection = "";
  if (failures.length > 0) {
    failureSection = "## Failures\n\n";
    for (const f of failures) {
      failureSection += `### ${f.name}\n\`\`\`\n${f.output.slice(-3000)}\n\`\`\`\n\n`;
    }
  }

  const summary = steps
    .map((s) => `- ${s.ok ? "PASS" : "FAIL"} — ${s.name}`)
    .join("\n");

  return `# PartyGames Test Report

Generated: ${new Date().toISOString()}

## Summary

${summary}

## Coverage audit

${auditSection}

${failureSection}

## Improvements / follow-up

- Review any FAIL steps above and Playwright HTML report in \`playwright-report/\`
- Re-run \`/test_games\` after fixes
`;
}

function main() {
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });

  const steps: StepResult[] = [
    runStep("Coverage audit", "pnpm test:games:audit"),
    runStep("Unit tests", "pnpm test:unit"),
    runStep("Server integration", "pnpm --filter @party-games/server test:integration"),
    runStep("E2E smoke", "pnpm test:games:e2e:smoke"),
    runStep("E2E full", "pnpm test:games:e2e:full"),
    runStep("E2E settings + host controls", "pnpm exec playwright test e2e/settings.spec.ts e2e/host-controls.spec.ts e2e/layout.spec.ts"),
  ];

  const reportPath = join(REPORT_DIR, `${timestamp()}-report.md`);
  writeFileSync(reportPath, buildReport(steps));
  console.log(`\nReport written to ${reportPath}`);

  const failed = steps.some((s) => !s.ok);
  if (failed) process.exit(1);
}

main();

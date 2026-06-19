import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const repoRoot = path.resolve(__dirname, "..");

test("homepage no longer uses the technical skeleton message", () => {
  const pageSource = fs.readFileSync(path.join(repoRoot, "src", "app", "page.tsx"), "utf8");

  assert.doesNotMatch(pageSource, /Technical skeleton is ready/);
  assert.doesNotMatch(pageSource, /Light CRM visual foundation/);
  assert.doesNotMatch(pageSource, /Route/);
  assert.match(pageSource, /Open leads/);
  assert.match(pageSource, /prefetch=\{false\}/);
});

test("homepage exposes a compact operational snapshot", () => {
  const homepageSource = fs.readFileSync(path.join(repoRoot, "src", "lib", "homepage.ts"), "utf8");

  assert.match(homepageSource, /Overdue work/);
  assert.match(homepageSource, /Due today/);
  assert.match(homepageSource, /Today's priorities/);
  assert.match(homepageSource, /Pipeline snapshot/);
  assert.match(homepageSource, /Open duplicate reviews/);
  assert.doesNotMatch(homepageSource, /Latest import/);
});

test("homepage snapshot falls back cleanly when data sources are unavailable", async () => {
  process.env.DATABASE_URL ??=
    "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public";
  const { getHomepageSnapshotWithSources } = await import("../src/lib/homepage");

  const normal = await getHomepageSnapshotWithSources({
    async getLeads() {
      return [
        {
          id: "1",
          businessName: "Lead A",
          city: null,
          category: null,
          leadStatus: "TO_AUDIT",
          priority: "HIGH",
          packageFit: "FIT",
          scoreTotal: 0,
          scoreLabel: null,
          nextActionAt: null,
          updatedAt: new Date("2026-06-18T10:00:00.000Z"),
          lastImportedAt: null
        },
        {
          id: "2",
          businessName: "Lead B",
          city: null,
          category: null,
          leadStatus: "CONTACTED",
          priority: "MEDIUM",
          packageFit: "FIT",
          scoreTotal: 0,
          scoreLabel: null,
          nextActionAt: new Date("2026-06-19T10:00:00.000Z"),
          updatedAt: new Date("2026-06-18T11:00:00.000Z"),
          lastImportedAt: null
        },
        {
          id: "3",
          businessName: "Lead C",
          city: null,
          category: null,
          leadStatus: "REPLIED",
          priority: "LOW",
          packageFit: "FIT",
          scoreTotal: 0,
          scoreLabel: null,
          nextActionAt: new Date("2026-06-20T10:00:00.000Z"),
          updatedAt: new Date("2026-06-18T12:00:00.000Z"),
          lastImportedAt: null
        }
      ] as never;
    },
    async getImportBatches() {
      return [{ status: "RUNNING", sourceName: "Import batch" }] as never;
    },
    async getDuplicateCandidates() {
      return [{ status: "OPEN" }, { status: "RESOLVED" }] as never;
    }
  });

  assert.equal(normal.length, 5);
  assert.deepEqual(normal[0], {
    label: "Overdue work",
    value: "0",
    description: "Leads needing attention now."
  });
  assert.deepEqual(normal[2], {
    label: "Today's priorities",
    value: "Lead A · Lead B",
    description: "Focus on 2 leads needing a decision or next step today."
  });
  assert.deepEqual(normal[3], {
    label: "Pipeline snapshot",
    value: "Intake 0 leads | Audit 1 lead | Outreach 1 lead | Conversation 1 lead | Offer 0 leads | Closed 0 leads",
    description: "Stage breakdown across the active pipeline."
  });
  assert.deepEqual(normal[4], {
    label: "Open duplicate reviews",
    value: "1",
    description: "Open candidate pairs remain secondary to sales work."
  });

  const fallback = await getHomepageSnapshotWithSources({
    async getLeads() {
      throw new Error("database unavailable");
    },
    async getImportBatches() {
      throw new Error("database unavailable");
    },
    async getDuplicateCandidates() {
      throw new Error("database unavailable");
    }
  });

  assert.equal(fallback.length, 1);
  assert.deepEqual(fallback[0], {
    label: "Operational snapshot unavailable",
    value: "CRM data temporarily unavailable",
    description: "CRM data is temporarily unavailable. Open leads, workbench, or health for the live workspace."
  });
});

test("visual direction doc exists and forbids cyber/admin styling", () => {
  const doc = fs.readFileSync(
    path.join(repoRoot, "docs", "design", "light-crm-visual-direction.md"),
    "utf8"
  );

  assert.match(doc, /light-first interface/);
  assert.match(doc, /dark cyber or cyberpunk styling/i);
  assert.match(doc, /design guidance, not as runtime code/i);
});

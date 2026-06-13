import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildLeadUrl,
  formatLeadResultSummary,
  normalizeLeadFilters
} from "../src/lib/lead-query";
import {
  DEFAULT_LEAD_PAGE_SIZE,
  getLeadPaginationItems,
  getLeadPageWindow,
  parseLeadPage
} from "../src/lib/lead-pagination";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("lead pagination helpers clamp pages and calculate visible ranges", () => {
  assert.equal(parseLeadPage(undefined), 1);
  assert.equal(parseLeadPage("abc"), 1);
  assert.equal(parseLeadPage("-2"), 1);
  assert.equal(parseLeadPage("0"), 1);
  assert.equal(parseLeadPage("4"), 4);

  assert.deepEqual(getLeadPageWindow(1, 0), {
    page: 1,
    pageSize: DEFAULT_LEAD_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
    rangeStart: 0,
    rangeEnd: 0,
    skip: 0,
    take: DEFAULT_LEAD_PAGE_SIZE
  });

  assert.deepEqual(getLeadPageWindow(2, 120, 50), {
    page: 2,
    pageSize: 50,
    totalCount: 120,
    totalPages: 3,
    rangeStart: 51,
    rangeEnd: 100,
    skip: 50,
    take: 50
  });

  assert.deepEqual(getLeadPageWindow(999, 120, 50), {
    page: 3,
    pageSize: 50,
    totalCount: 120,
    totalPages: 3,
    rangeStart: 101,
    rangeEnd: 120,
    skip: 100,
    take: 50
  });

  assert.deepEqual(getLeadPaginationItems(4, 10), [
    { type: "page", page: 1 },
    { type: "ellipsis", key: "start" },
    { type: "page", page: 3 },
    { type: "page", page: 4 },
    { type: "page", page: 5 },
    { type: "ellipsis", key: "end" },
    { type: "page", page: 10 }
  ]);
});

test("lead query helpers preserve filters and reset page only when filters change", () => {
  assert.equal(
    buildLeadUrl("/leads", "status=CONTACTED&priority=HIGH&page=3", { priority: "LOW" }),
    "/leads?status=CONTACTED&priority=LOW"
  );
  assert.equal(
    buildLeadUrl("/leads", "status=CONTACTED&priority=HIGH&page=3", { page: 2 }),
    "/leads?status=CONTACTED&priority=HIGH&page=2"
  );
  assert.equal(
    buildLeadUrl("/leads", "status=CONTACTED&priority=HIGH&page=3", { city: "" }),
    "/leads?status=CONTACTED&priority=HIGH"
  );
  assert.equal(
    buildLeadUrl("/leads", "status=CONTACTED&priority=HIGH&page=3", {
      status: null,
      priority: null,
      city: null,
      packageFit: null,
      page: 1
    }),
    "/leads"
  );
});

test("lead query helpers format the result counter text", () => {
  assert.equal(formatLeadResultSummary(0, 0, 0), "0 leads");
  assert.equal(formatLeadResultSummary(1, 50, 2000), "1–50 of 2,000 leads");
  assert.equal(formatLeadResultSummary(51, 100, 2000), "51–100 of 2,000 leads");
  assert.equal(formatLeadResultSummary(1, 17, 17), "1–17 of 17 leads");
});

test("lead filter normalizer keeps only active filter values", () => {
  assert.deepEqual(
    normalizeLeadFilters({
      status: "CONTACTED",
      priority: "",
      city: ["Gliwice"],
      packageFit: undefined
    }),
    { status: "CONTACTED", city: "Gliwice" }
  );
});

test("lead data layer keeps paginated and unpaginated query paths separate", () => {
  const leadsSource = read("src/lib/leads.ts");

  assert.match(leadsSource, /export async function getLeadPage\(/);
  assert.match(leadsSource, /const where = buildLeadWhere\(filters\);/);
  assert.match(leadsSource, /count\(\{ where \}\)/);
  assert.match(
    leadsSource,
    /findMany\(\{\s*where,\s*orderBy: \[\{ updatedAt: "desc" \}, \{ businessName: "asc" \}, \{ id: "asc" \}\],\s*skip: pagination\.skip,\s*take: pagination\.take,\s*select: leadListSelect\s*\}\)/s
  );
  assert.match(
    leadsSource,
    /export async function getLeads\(filters: LeadFilters = \{\}\) \{\s*return prisma\.lead\.findMany\(\{\s*where: buildLeadWhere\(filters\),\s*orderBy: \[\{ updatedAt: "desc" \}, \{ businessName: "asc" \}\],\s*select: leadListSelect\s*\}\);/s
  );
  assert.match(leadsSource, /buildLeadWhere\(filters: LeadFilters\): Prisma\.LeadWhereInput/);
  assert.match(leadsSource, /city: \{\s*contains: filters\.city,/s);
});

test("lead pagination ui keeps keyboard and aria affordances", () => {
  const toolbarSource = read("src/components/lead-filters.tsx");
  const paginationSource = read("src/components/lead-pagination.tsx");

  assert.match(toolbarSource, /useRouter/);
  assert.match(toolbarSource, /useSearchParams/);
  assert.match(toolbarSource, /useTransition/);
  assert.match(toolbarSource, /router\.replace\(/);
  assert.match(toolbarSource, /Updating\.\.\./);
  assert.doesNotMatch(toolbarSource, /Apply filters/);
  assert.match(toolbarSource, /Clear filters/);
  assert.match(toolbarSource, /resultSummary/);
  assert.match(toolbarSource, /aria-busy=\{isPending\}/);

  assert.match(paginationSource, /aria-label="Lead pagination"/);
  assert.match(paginationSource, /aria-current="page"/);
  assert.match(paginationSource, /aria-disabled="true"/);
  assert.match(paginationSource, /Previous/);
  assert.match(paginationSource, /Next/);
  assert.match(paginationSource, /tabular-nums/);
});

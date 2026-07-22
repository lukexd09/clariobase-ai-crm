import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");
const read = (filePath: string) => fs.readFileSync(path.join(repoRoot, filePath), "utf8");

test("health page is non-cacheable and uses the shared runtime readiness checks", () => {
  const source = read("src/app/health/page.tsx");

  assert.match(source, /unstable_noStore as noStore/);
  assert.match(source, /export const dynamic = "force-dynamic"/);
  assert.match(source, /export const revalidate = 0/);
  assert.match(source, /noStore\(\)/);
  assert.match(source, /getRuntimeReadiness\(\)/);
  assert.match(source, /body\.checks\.database/);
  assert.match(source, /body\.checks\.authentication/);
  assert.doesNotMatch(source, /const status =|status: "ok"/);
});

test("health page uses ClarioBase surfaces, localized time and secondary machine details", () => {
  const source = read("src/app/health/page.tsx");

  assert.match(source, /SurfaceHeader/);
  assert.match(source, /SurfaceContent/);
  assert.match(source, /TechnicalDisclosure/);
  assert.match(source, /formatDateTime\(body\.timestamp\)/);
  assert.match(source, /t\("health\.application"\)/);
  assert.match(source, /t\("health\.lastCheck"\)/);
  assert.match(source, /\{body\.service\}/);
  assert.match(source, /\{body\.status\}/);
  assert.doesNotMatch(source, /<main|bg-slate-|bg-white|text-slate-|border-slate-|text-emerald-/);
});

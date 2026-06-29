import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("health page keeps the non-cacheable lightweight service contract", () => {
  const source = read("src/app/health/page.tsx");

  assert.match(source, /unstable_noStore as noStore/);
  assert.match(source, /export const dynamic = "force-dynamic"/);
  assert.match(source, /export const revalidate = 0/);
  assert.match(source, /noStore\(\)/);
  assert.match(source, /service: "clariobase-ai-crm"/);
  assert.match(source, /status: "ok"/);
  assert.match(source, /new Date\(\)\.toISOString\(\)/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("E016.T014 owns an executable build-once same-image runtime proof", () => {
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };
  const proof = read("scripts/verify-environment-runtime.ts");

  assert.equal(
    packageJson.scripts["docker:test-environment-runtime"],
    "tsx scripts/verify-environment-runtime.ts"
  );
  assert.match(proof, /"build",\s*"--target",\s*"runtime"/s);
  assert.match(proof, /let buildCount = 0/);
  assert.match(proof, /assert\.equal\(buildCount, 1/);
  assert.match(proof, /assertSameImageIdentity\(imageId, `before \$\{runtimeCase\.name\} case`\)/);
  assert.match(proof, /args\.push\(imageId\)/);
  assert.match(proof, /databaseContainerName\.length <= 63/);
  assert.doesNotMatch(proof, /args\.push\(imageTag\)/);
});

test("runtime cases cross readiness and server-rendered HTML with fail-safe marker assertions", () => {
  const proof = read("scripts/verify-environment-runtime.ts");

  assert.match(proof, /name: "preview", deploymentEnv: "preview", expectIndicator: true/);
  assert.match(proof, /name: "production", deploymentEnv: "production", expectIndicator: false/);
  assert.match(proof, /name: "missing", expectIndicator: true/);
  assert.match(proof, /name: "invalid", deploymentEnv: "prod", expectIndicator: true/);
  assert.match(proof, /name: "padded-production", deploymentEnv: " production ", expectIndicator: true/);
  assert.match(proof, /\/api\/ready/);
  assert.match(proof, /\/health/);
  assert.match(proof, /Health check/);
  assert.match(proof, /warning banner must be removed entirely/);
  assert.match(proof, /watermarkPattern/);
  assert.match(proof, /markCount,\s*runtimeCase\.expectIndicator \? 8 : 0/);
  assert.match(proof, /cleanup\.registerDockerVolume\(volumeName\)/);
  assert.match(proof, /assertCleanupComplete\(\)/);
  assert.doesNotMatch(proof, /all four runtime cases/);
});

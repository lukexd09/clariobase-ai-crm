import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function hasDocker() {
  const result = spawnSync("docker", ["version"], {
    cwd: repoRoot,
    stdio: "ignore"
  });

  return result.status === 0;
}

test("Docker image assets enforce the E014 image contract", () => {
  const dockerfile = read("Dockerfile");
  const dockerignore = read(".dockerignore");
  const imageDoc = read("docs/runtime/container-image.md");
  const readme = read("README.md");
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };

  assert.match(readme, /docs\/runtime\/container-image\.md/);
  assert.equal(packageJson.scripts["docker:test-image"], "tsx scripts/verify-docker-image.ts");
  assert.match(packageJson.scripts["prisma:migrate"], /--env-file=\.env\.local/);
  assert.match(packageJson.scripts["prisma:seed"], /--env-file=\.env\.local/);
  assert.match(packageJson.scripts["leads:import"], /--env-file=\.env\.local/);
  assert.match(packageJson.scripts["leads:detect-duplicates"], /--env-file=\.env\.local/);
  assert.match(packageJson.scripts["ai:export-leads"], /--env-file=\.env\.local/);
  assert.match(packageJson.scripts["ai:validate-import-file"], /--env-file=\.env\.local/);

  assert.match(imageDoc, /document_id: DOC-E014-CONTAINER-IMAGE/);
  assert.match(imageDoc, /docker build -t clariobase-ai-crm:local \./);
  assert.match(imageDoc, /corepack pnpm docker:test-image/);
  assert.match(imageDoc, /node \.\/node_modules\/next\/dist\/bin\/next start/);
  assert.match(imageDoc, /Prisma CLI available/i);
  assert.match(imageDoc, /node \.\/node_modules\/tsx\/dist\/cli\.mjs/);
  assert.match(imageDoc, /data\/ai-exchange/);
  assert.match(imageDoc, /PostgreSQL 16/);
  assert.match(imageDoc, /\/imports/);

  assert.match(dockerfile, /FROM node:24-bookworm-slim AS base/);
  assert.match(dockerfile, /apt-get install -y --no-install-recommends openssl/);
  assert.match(dockerfile, /corepack prepare pnpm@9\.15\.0 --activate/);
  assert.match(dockerfile, /pnpm install --frozen-lockfile/);
  assert.match(dockerfile, /ARG BUILD_DATABASE_URL=/);
  assert.match(dockerfile, /ENV DATABASE_URL="\$BUILD_DATABASE_URL"/);
  assert.match(dockerfile, /COPY \.env\.example \.\/$/m);
  assert.match(dockerfile, /COPY scripts\/import-leads\.ts scripts\/detect-duplicates\.ts scripts\/export-ai-leads\.ts scripts\/validate-ai-import-file\.ts \.\/scripts\//);
  assert.match(dockerfile, /COPY --chown=node:node next\.config\.ts prisma\.config\.ts tsconfig\.json \.\//);
  assert.match(dockerfile, /RUN pnpm build/);
  assert.match(dockerfile, /COPY --chown=node:node --from=builder \/app\/prisma \.\/prisma/);
  assert.match(dockerfile, /COPY --chown=node:node --from=builder \/app\/scripts \.\/scripts/);
  assert.match(dockerfile, /COPY --chown=node:node --from=builder \/app\/src \.\/src/);
  assert.match(dockerfile, /EXPOSE 3000/);
  assert.match(dockerfile, /CMD \["node", "\.\/node_modules\/next\/dist\/bin\/next", "start"\]/);

  assert.match(dockerignore, /^\.env$/m);
  assert.match(dockerignore, /^!\.env\.example$/m);
  assert.match(dockerignore, /^src\/generated$/m);
  assert.match(dockerignore, /^data$/m);
  assert.match(dockerignore, /^ai_exchange$/m);
  assert.match(dockerignore, /^node_modules$/m);
  assert.match(dockerignore, /^\.next$/m);
  assert.match(dockerignore, /^tests$/m);
});

test("Docker image verification script builds and smoke-tests the image when Docker is available", () => {
  if (!hasDocker()) {
    return;
  }

  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [tsxCli, "scripts/verify-docker-image.ts"], {
    cwd: repoRoot,
    stdio: "inherit"
  });

  assert.equal(result.status, 0, "docker image verification should pass");
});

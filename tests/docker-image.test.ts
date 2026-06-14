import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("Docker image assets enforce the E014 image contract", () => {
  const dockerfile = read("Dockerfile");
  const dockerignore = read(".dockerignore");
  const imageDoc = read("docs/runtime/container-image.md");
  const readme = read("README.md");

  assert.match(readme, /docs\/runtime\/container-image\.md/);

  assert.match(imageDoc, /document_id: DOC-E014-CONTAINER-IMAGE/);
  assert.match(imageDoc, /docker build -t clariobase-ai-crm:local \./);
  assert.match(imageDoc, /pnpm start/);
  assert.match(imageDoc, /Prisma CLI available/i);
  assert.match(imageDoc, /data\/ai-exchange/);

  assert.match(dockerfile, /FROM node:24-bookworm-slim AS base/);
  assert.match(dockerfile, /apt-get install -y --no-install-recommends openssl/);
  assert.match(dockerfile, /pnpm install --frozen-lockfile/);
  assert.match(dockerfile, /ARG BUILD_DATABASE_URL=/);
  assert.match(dockerfile, /ENV DATABASE_URL="\$BUILD_DATABASE_URL"/);
  assert.match(dockerfile, /COPY \.env\.example \.\/$/m);
  assert.match(dockerfile, /RUN pnpm build/);
  assert.match(dockerfile, /COPY --chown=node:node --from=builder \/app\/prisma \.\/prisma/);
  assert.match(dockerfile, /COPY --chown=node:node --from=builder \/app\/src\/generated \.\/src\/generated/);
  assert.match(dockerfile, /EXPOSE 3000/);
  assert.match(dockerfile, /CMD \["pnpm", "start"\]/);

  assert.match(dockerignore, /^\.env$/m);
  assert.match(dockerignore, /^!\.env\.example$/m);
  assert.match(dockerignore, /^src\/generated$/m);
  assert.match(dockerignore, /^data$/m);
  assert.match(dockerignore, /^ai_exchange$/m);
  assert.match(dockerignore, /^node_modules$/m);
  assert.match(dockerignore, /^\.next$/m);
  assert.match(dockerignore, /^tests$/m);
});

import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const bundleRoot = process.argv[2];
if (!bundleRoot) {
  throw new Error("bundle root argument required");
}

function run(command: string, args: string[]) {
  return spawnSync(command, args, { encoding: "utf8", shell: false });
}

async function main() {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "clariobase-e011-image-"));
  const contextRoot = path.join(tmpRoot, "context");
  await cp(repoRoot, contextRoot, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.pytest_cache`) && !src.includes(`${path.sep}node_modules`)
  });
  await cp(bundleRoot, path.join(contextRoot, "bundle"), { recursive: true });

  const dockerfile = path.join(contextRoot, "Dockerfile.e011-proof");
  await writeFile(dockerfile, `
FROM node:24-bookworm-slim
WORKDIR /work
COPY . /work
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
CMD ["bash", "-lc", "rm -rf /work/node_modules /work/.next /work/src/generated/prisma && cp -R /work/bundle/node_modules /work/node_modules && pnpm install --offline --frozen-lockfile --store-dir /work/bundle/pnpm-store && export BETTER_AUTH_PROOF_DATABASE_URL='postgresql://postgres:clariobase_test_password@crm-postgres:5432/clariobase_auth_image?schema=public' && pnpm auth:proof"]
`.trimStart(), "utf8");

  const imageTag = `clariobase-e011-proof-${Date.now()}`;
  const build = run("docker", ["build", "-f", dockerfile, "-t", imageTag, contextRoot]);
  if (build.status !== 0) throw new Error(build.stderr || "image build failed");

  const digestInspect = run("docker", ["inspect", "--format", "{{index .RepoDigests 0}}", imageTag]);
  if (digestInspect.status !== 0) throw new Error(digestInspect.stderr || "image inspect failed");
  const digest = digestInspect.stdout.trim();

  const network = `e011-image-${Date.now()}`;
  const dbContainer = `e011-image-pg-${Date.now()}`;
  const createdNetwork = run("docker", ["network", "create", "--internal", network]);
  if (createdNetwork.status !== 0) throw new Error(createdNetwork.stderr || "network create failed");
  const postgres = run("docker", [
    "run", "-d", "--rm", "--name", dbContainer, "--network", network,
    "-e", "POSTGRES_PASSWORD=clariobase_test_password",
    "-e", "POSTGRES_DB=clariobase_auth_image",
    "postgres:16"
  ]);
  if (postgres.status !== 0) throw new Error(postgres.stderr || "postgres start failed");

  const runImage = run("docker", ["run", "--rm", "--network", network, digest]);
  run("docker", ["stop", dbContainer]);
  run("docker", ["network", "rm", network]);
  await rm(tmpRoot, { recursive: true, force: true });

  console.log(JSON.stringify({
    imageTag,
    digest,
    buildStatus: build.status,
    runStatus: runImage.status,
    runStdout: runImage.stdout?.toString(),
    runStderr: runImage.stderr?.toString()
  }, null, 2));

  process.exitCode = runImage.status ?? 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

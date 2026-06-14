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

test("Compose runtime assets enforce the E014 local topology contract", () => {
  const composeFile = read("compose.yaml");
  const composeEnvExample = read(".env.compose.example");
  const runtimeContract = read("docs/runtime/container-runtime.md");
  const packageJson = JSON.parse(read("package.json")) as {
    scripts: Record<string, string>;
  };

  assert.equal(packageJson.scripts["docker:test-runtime"], "tsx scripts/verify-compose-runtime.ts");

  assert.match(composeFile, /crm-app:/);
  assert.match(composeFile, /crm-postgres:/);
  assert.match(composeFile, /image: postgres:16/);
  assert.match(composeFile, /restart: unless-stopped/g);
  assert.match(composeFile, /pg_isready/);
  assert.match(composeFile, /condition: service_healthy/);
  assert.match(composeFile, /crm-postgres-data:\/var\/lib\/postgresql\/data/);
  assert.match(composeFile, /POSTGRES_PASSWORD: \$\{CRM_POSTGRES_PASSWORD:\?Set_CRM_POSTGRES_PASSWORD\}/);
  assert.match(composeFile, /DATABASE_URL: \$\{CRM_DATABASE_URL:-postgresql:\/\/\$\{CRM_POSTGRES_USER:-clariobase_crm_user\}:\$\{CRM_POSTGRES_PASSWORD:\?Set_CRM_POSTGRES_PASSWORD\}@crm-postgres:5432\/\$\{CRM_POSTGRES_DB:-clariobase_crm\}\?schema=public\}/);
  assert.match(composeFile, /crm-app:[\s\S]*healthcheck:[\s\S]*\/api\/ready/);
  assert.match(composeFile, /\$\{CRM_BIND_ADDRESS:-127\.0\.0\.1\}:\$\{CRM_HOST_PORT:-3000\}:3000/);
  assert.match(composeFile, /source: \$\{AI_EXCHANGE_HOST_PATH:-\.\/data\/ai-exchange\}/);
  assert.match(composeFile, /target: \/app\/data\/ai-exchange/);

  assert.match(composeEnvExample, /^CRM_BIND_ADDRESS=127\.0\.0\.1$/m);
  assert.match(composeEnvExample, /^CRM_HOST_PORT=3000$/m);
  assert.match(composeEnvExample, /^AI_EXCHANGE_HOST_PATH=\.\/data\/ai-exchange$/m);
  assert.match(composeEnvExample, /^CRM_POSTGRES_DB=clariobase_crm$/m);
  assert.match(composeEnvExample, /^CRM_POSTGRES_USER=clariobase_crm_user$/m);
  assert.match(composeEnvExample, /^CRM_POSTGRES_PASSWORD=$/m);
  assert.match(composeEnvExample, /^CRM_DATABASE_URL=$/m);

  assert.match(runtimeContract, /crm-app/);
  assert.match(runtimeContract, /crm-postgres/);
  assert.match(runtimeContract, /CRM_DATABASE_URL/);
  assert.match(runtimeContract, /CRM_BIND_ADDRESS/);
  assert.match(runtimeContract, /CRM_HOST_PORT/);
  assert.match(runtimeContract, /AI_EXCHANGE_HOST_PATH/);
  assert.match(runtimeContract, /\/api\/ready/);
  assert.match(runtimeContract, /returns HTTP `503` when the configured CRM database is unavailable/i);
});

test("Compose config resolves the documented first-run env-file contract", () => {
  if (!hasDocker()) {
    return;
  }

  const tmpRoot = path.join(repoRoot, ".codex-tmp", `compose-runtime-defaults-${process.pid}`);
  const envPath = path.join(tmpRoot, "compose.env");

  fs.mkdirSync(tmpRoot, { recursive: true });
  fs.writeFileSync(
    envPath,
    [
      "CRM_BIND_ADDRESS=127.0.0.1",
      "CRM_HOST_PORT=3000",
      "AI_EXCHANGE_HOST_PATH=./data/ai-exchange",
      "CRM_POSTGRES_DB=clariobase_crm",
      "CRM_POSTGRES_USER=clariobase_crm_user",
      "CRM_POSTGRES_PASSWORD=clariobase_test_password"
    ].join("\n")
  );

  try {
    const result = spawnSync("docker", ["compose", "--env-file", envPath, "config"], {
      cwd: repoRoot,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, `docker compose config should pass: ${result.stderr}`);
    assert.match(result.stdout, /host_ip: 127\.0\.0\.1/);
    assert.match(result.stdout, /published: "3000"/);
    assert.match(result.stdout, /target: 3000/);
    assert.match(result.stdout, /POSTGRES_DB: clariobase_crm/);
    assert.match(result.stdout, /POSTGRES_USER: clariobase_crm_user/);
    assert.match(result.stdout, /POSTGRES_PASSWORD: clariobase_test_password/);
    assert.match(result.stdout, /DATABASE_URL: postgres(?:ql)?:\/\/clariobase_crm_user:clariobase_test_password@crm-postgres:5432\/clariobase_crm\?schema=public/);
    assert.match(result.stdout, /data\/ai-exchange|data\\ai-exchange/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("Compose config accepts an explicit CRM_DATABASE_URL override for URI-encoded credentials", () => {
  if (!hasDocker()) {
    return;
  }

  const tmpRoot = path.join(repoRoot, ".codex-tmp", `compose-runtime-config-${process.pid}`);
  const envPath = path.join(tmpRoot, "compose.env");

  fs.mkdirSync(tmpRoot, { recursive: true });
  fs.writeFileSync(
    envPath,
    [
      "CRM_BIND_ADDRESS=127.0.0.1",
      "CRM_HOST_PORT=3017",
      "AI_EXCHANGE_HOST_PATH=./data/ai-exchange",
      "CRM_POSTGRES_DB=clariobase_crm_encoded",
      "CRM_POSTGRES_USER=clariobase_crm_user",
      "CRM_POSTGRES_PASSWORD=p@ss:word",
      "CRM_DATABASE_URL=postgresql://clariobase_crm_user:p%40ss%3Aword@crm-postgres:5432/clariobase_crm_encoded?schema=public"
    ].join("\n")
  );

  try {
    const result = spawnSync("docker", ["compose", "--env-file", envPath, "config"], {
      cwd: repoRoot,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, `docker compose config with CRM_DATABASE_URL override should pass: ${result.stderr}`);
    assert.match(result.stdout, /POSTGRES_PASSWORD: p@ss:word/);
    assert.match(
      result.stdout,
      /DATABASE_URL: postgres(?:ql)?:\/\/clariobase_crm_user:p%40ss%3Aword@crm-postgres:5432\/clariobase_crm_encoded\?schema=public/
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("Compose runtime verification covers readiness, failure path and restart behavior", () => {
  if (!hasDocker()) {
    return;
  }

  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [tsxCli, "scripts/verify-compose-runtime.ts"], {
    cwd: repoRoot,
    stdio: "inherit"
  });

  assert.equal(result.status, 0, "compose runtime verification should pass");
});

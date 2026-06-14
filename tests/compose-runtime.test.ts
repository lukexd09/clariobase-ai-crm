import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

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

function runDocker(args: string[], options?: { stdio?: "inherit" | "pipe" }) {
  return spawnSync("docker", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: options?.stdio ?? "pipe"
  });
}

async function waitForDockerHealth(containerName: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = runDocker(["inspect", "--format={{.State.Health.Status}}", containerName]);

    if (result.status === 0 && result.stdout.trim() === "healthy") {
      return;
    }

    await delay(1000);
  }

  throw new Error(`Container ${containerName} did not become healthy in time.`);
}

async function waitForHttp200(url: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url);

      if (response.status === 200) {
        return;
      }
    } catch {
      // Retry until the service becomes available.
    }

    await delay(1000);
  }

  throw new Error(`${url} did not return HTTP 200 in time.`);
}

test("Compose runtime assets enforce the E014 local topology contract", () => {
  const composeFile = read("compose.yaml");
  const composeEnvExample = read(".env.compose.example");
  const runtimeContract = read("docs/runtime/container-runtime.md");

  assert.match(composeFile, /crm-app:/);
  assert.match(composeFile, /crm-postgres:/);
  assert.match(composeFile, /image: postgres:16/);
  assert.match(composeFile, /restart: unless-stopped/g);
  assert.match(composeFile, /pg_isready/);
  assert.match(composeFile, /condition: service_healthy/);
  assert.match(composeFile, /crm-postgres-data:\/var\/lib\/postgresql\/data/);
  assert.match(composeFile, /DATABASE_URL: postgresql:\/\/\$\{CRM_POSTGRES_USER:-clariobase_crm_user\}:\$\{CRM_POSTGRES_PASSWORD:-change-me\}@crm-postgres:5432\/\$\{CRM_POSTGRES_DB:-clariobase_crm\}\?schema=public/);
  assert.match(composeFile, /\$\{CRM_BIND_ADDRESS:-127\.0\.0\.1\}:\$\{CRM_HOST_PORT:-3000\}:3000/);
  assert.match(composeFile, /source: \$\{AI_EXCHANGE_HOST_PATH:-\.\/data\/ai-exchange\}/);
  assert.match(composeFile, /target: \/app\/data\/ai-exchange/);

  assert.match(composeEnvExample, /^CRM_BIND_ADDRESS=127\.0\.0\.1$/m);
  assert.match(composeEnvExample, /^CRM_HOST_PORT=3000$/m);
  assert.match(composeEnvExample, /^AI_EXCHANGE_HOST_PATH=\.\/data\/ai-exchange$/m);
  assert.match(composeEnvExample, /^CRM_POSTGRES_DB=clariobase_crm$/m);
  assert.match(composeEnvExample, /^CRM_POSTGRES_USER=clariobase_crm_user$/m);
  assert.match(composeEnvExample, /^CRM_POSTGRES_PASSWORD=change-me$/m);

  assert.match(runtimeContract, /crm-app/);
  assert.match(runtimeContract, /crm-postgres/);
  assert.match(runtimeContract, /CRM_BIND_ADDRESS/);
  assert.match(runtimeContract, /CRM_HOST_PORT/);
  assert.match(runtimeContract, /AI_EXCHANGE_HOST_PATH/);
});

test("Compose config resolves safe defaults for first-run local runtime", () => {
  if (!hasDocker()) {
    return;
  }

  const result = spawnSync("docker", ["compose", "config"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `docker compose config should pass: ${result.stderr}`);
  assert.match(result.stdout, /host_ip: 127\.0\.0\.1/);
  assert.match(result.stdout, /published: "3000"/);
  assert.match(result.stdout, /target: 3000/);
  assert.match(result.stdout, /POSTGRES_DB: clariobase_crm/);
  assert.match(result.stdout, /POSTGRES_USER: clariobase_crm_user/);
  assert.match(result.stdout, /POSTGRES_PASSWORD: change-me/);
  assert.match(result.stdout, /DATABASE_URL: postgres(?:ql)?:\/\/clariobase_crm_user:change-me@crm-postgres:5432\/clariobase_crm\?schema=public/);
  assert.match(result.stdout, /data\/ai-exchange|data\\ai-exchange/);
});

test("Compose verification follows the approved first-run migration sequence", async () => {
  if (!hasDocker()) {
    return;
  }

  const project = `clariobase-e014-compose-test-${process.pid}`;
  const tmpRoot = path.join(repoRoot, ".codex-tmp", `compose-runtime-test-${process.pid}`);
  const aiPath = path.join(tmpRoot, "ai-exchange");
  const envPath = path.join(tmpRoot, "compose.env");
  const hostPort = "3016";

  fs.mkdirSync(aiPath, { recursive: true });
  fs.writeFileSync(
    envPath,
    [
      "CRM_BIND_ADDRESS=127.0.0.1",
      `CRM_HOST_PORT=${hostPort}`,
      `AI_EXCHANGE_HOST_PATH=${aiPath.replace(/\\\\/g, "/")}`,
      "CRM_POSTGRES_DB=clariobase_crm_compose_test",
      "CRM_POSTGRES_USER=clariobase_crm_user",
      "CRM_POSTGRES_PASSWORD=clariobase_test_password"
    ].join("\n")
  );

  try {
    let result = runDocker(
      ["compose", "--project-name", project, "--env-file", envPath, "build"],
      { stdio: "inherit" }
    );
    assert.equal(result.status, 0, "docker compose build should pass");

    result = runDocker(
      ["compose", "--project-name", project, "--env-file", envPath, "up", "-d", "crm-postgres"],
      { stdio: "inherit" }
    );
    assert.equal(result.status, 0, "docker compose up -d crm-postgres should pass");

    await waitForDockerHealth(`${project}-crm-postgres-1`);

    result = runDocker(
      [
        "compose",
        "--project-name",
        project,
        "--env-file",
        envPath,
        "run",
        "--rm",
        "crm-app",
        "sh",
        "-lc",
        "node ./node_modules/prisma/build/index.js migrate deploy"
      ],
      { stdio: "inherit" }
    );
    assert.equal(result.status, 0, "one-off compose migration command should pass");

    result = runDocker(
      ["compose", "--project-name", project, "--env-file", envPath, "up", "-d", "crm-app"],
      { stdio: "inherit" }
    );
    assert.equal(result.status, 0, "docker compose up -d crm-app should pass");

    await waitForHttp200(`http://127.0.0.1:${hostPort}/health`);
    await waitForHttp200(`http://127.0.0.1:${hostPort}/imports`);
  } finally {
    runDocker(
      ["compose", "--project-name", project, "--env-file", envPath, "down", "-v"],
      { stdio: "inherit" }
    );
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
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
  assert.match(composeFile, /DATABASE_URL: postgresql:\/\/\$\{CRM_POSTGRES_USER\}:\$\{CRM_POSTGRES_PASSWORD\}@crm-postgres:5432\/\$\{CRM_POSTGRES_DB\}\?schema=public/);
  assert.match(composeFile, /\$\{CRM_BIND_ADDRESS\}:\$\{CRM_HOST_PORT\}:3000/);
  assert.match(composeFile, /source: \$\{AI_EXCHANGE_HOST_PATH\}/);
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

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function productionSource() {
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) files.push(target);
    }
  };
  walk(path.join(root, "src"));
  return files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
}

function main() {
  const packageJson = JSON.parse(read("package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
  const source = productionSource();
  const auth = read("src/lib/auth.ts");
  const parser = read("src/lib/auth-runtime-config.ts");
  const route = read("src/app/api/auth/[...all]/route.ts");
  const privateOverlay = read("compose.private-https.yaml");
  const compose = `${read("compose.yaml")}\n${privateOverlay}`;

  assert.equal(dependencies.includes("@better-auth/infra"), false);
  assert.equal(dependencies.some((name) => /oauth|openid|saml|telemetry|analytics/i.test(name) && name !== "better-auth"), false);
  assert.doesNotMatch(source, /BETTER_AUTH_(?:API_KEY|INFRA_URL)/);
  assert.doesNotMatch(source, /https?:\/\/(?:api\.)?better-auth\.(?:com|dev)/i);
  assert.doesNotMatch(auth, /socialProviders|organization\(|genericOAuth|sso\(|oauthProxy/);
  assert.doesNotMatch(source, /auth\.api\.(?:impersonateUser|stopImpersonating|removeUser)\s*\(/);
  assert.match(auth, /disableSignUp: true/);
  assert.match(auth, /disabledPaths: \["\/sign-up\/email"\]/);
  assert.match(auth, /telemetry:\s*\{\s*enabled: false,\s*debug: false/s);
  assert.match(parser, /BETTER_AUTH_TELEMETRY_ENDPOINT/);
  assert.match(route, /withAuthProxyContract/);
  assert.doesNotMatch(compose, /docker\.sock|privileged:\s*true|network_mode:\s*host/);
  assert.doesNotMatch(privateOverlay.split("  crm-app:")[0], /ports:/);
  assert.match(privateOverlay, /crm-app:[\s\S]*?ports: !reset \[\]/);

  console.log(JSON.stringify({
    result: "PASS",
    betterAuthInfrastructure: false,
    betterAuthApiKeys: false,
    managedEndpoints: false,
    telemetryEnabled: false,
    socialOrOAuthProviders: false,
    organizationOrWorkspacePlugins: false,
    publicSignup: false,
    publicAdminNamespace: false,
    impersonationGatewayCalls: false,
    dockerSocket: false,
    privilegedOrHostNetwork: false
  }));
}

main();

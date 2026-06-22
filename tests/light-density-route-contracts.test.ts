import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { reserveFreePort, terminateProcessTree } from "../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function buildProductionApp() {
  const result = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
    }
  });

  assert.equal(result.status, 0, `next build should pass: ${result.stderr ?? result.stdout}`);
}

async function waitForHttp(url: string, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store"
        }
      });

      if (response.status === 200) {
        return response;
      }
    } catch {
      // Retry until the server is ready.
    }

    await delay(500);
  }

  throw new Error(`${url} did not return HTTP 200 in time.`);
}

test("T008 rendered routes keep the compact light CRM contract", { timeout: 180000 }, async () => {
  buildProductionApp();

  const port = await reserveFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
    }
  });
  const childPid = child.pid ?? 0;

  assert.ok(childPid > 0, "Next.js server PID should be available");

  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  const routes = [
    {
      path: "/",
      heading: "Lead operations in one focused workspace.",
      activeNav: "Home",
      includes: ["Open leads", "Open workbench", "Health check"]
    },
    {
      path: "/health",
      heading: "Health check",
      activeNav: "Health check",
      includes: ["System status", "Timestamp"]
    }
  ] as const;

  try {
    for (const route of routes) {
      const response = await waitForHttp(`${baseUrl}${route.path}`);
      const html = await response.text();

      assert.match(html, /<main/i, `${route.path} should render a main landmark`);
      assert.match(html, /Main navigation/, `${route.path} should render shell navigation`);
      assert.match(html, /aria-current="page"/, `${route.path} should expose the active route`);
      assert.match(html, new RegExp(route.heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(html, new RegExp(route.activeNav.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.doesNotMatch(html, /bg-slate-950|border-slate-800/);
      assert.doesNotMatch(html, /Minimal runtime probe for deployment and uptime checks\./);

      for (const snippet of route.includes) {
        assert.match(
          html,
          new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
          `${route.path} should include ${snippet}`
        );
      }
    }
  } finally {
    terminateProcessTree(childPid);
    child.removeAllListeners();
  }

  assert.doesNotMatch(output, /Failed to compile|Type error/i, output);
});

test("ux prototype routes bypass the production app shell", { timeout: 180000 }, async () => {
  buildProductionApp();

  const port = await reserveFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://clariobase_crm_user:clariobase_test_password@localhost:5432/clariobase_crm?schema=public"
    }
  });
  const childPid = child.pid ?? 0;
  assert.ok(childPid > 0, "Next.js server PID should be available");

  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });

  try {
    const prototypeRoot = await waitForHttp(`${baseUrl}/ux-prototype`);
    const nestedPrototype = await waitForHttp(`${baseUrl}/ux-prototype/leads?state=default`);
    const productionRoute = await waitForHttp(`${baseUrl}/`);

    const [prototypeRootHtml, nestedPrototypeHtml, productionHtml] = await Promise.all([
      prototypeRoot.text(),
      nestedPrototype.text(),
      productionRoute.text()
    ]);

    assert.doesNotMatch(prototypeRootHtml, /Main navigation/);
    assert.doesNotMatch(nestedPrototypeHtml, /Main navigation/);
    assert.match(prototypeRootHtml, /Review tools/);
    assert.match(nestedPrototypeHtml, /Review tools/);
    assert.match(prototypeRootHtml, /UX prototype/);
    assert.match(prototypeRootHtml, /No data is saved/);
    assert.match(nestedPrototypeHtml, /UX prototype/);
    assert.match(nestedPrototypeHtml, /No data is saved/);
    assert.match(productionHtml, /Main navigation/);
    assert.match(productionHtml, /Open leads/);
    assert.doesNotMatch(productionHtml, /UX prototype — no data is saved/);
    assert.match(nestedPrototypeHtml, /Leads/);
  } finally {
    terminateProcessTree(childPid);
    child.removeAllListeners();
  }

  assert.doesNotMatch(output, /Failed to compile|Type error/i, output);
});

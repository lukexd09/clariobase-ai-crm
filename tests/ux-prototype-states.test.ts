import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { reserveFreePort, terminateProcessTree } from "../scripts/docker-test-support";

const repoRoot = path.resolve(__dirname, "..");
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function build() {
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
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

async function waitForPage(url: string) {
  const started = Date.now();
  while (Date.now() - started < 60000) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return response;
    } catch {}
    await delay(500);
  }
  throw new Error(`${url} did not become ready`);
}

test("ux prototype renders state-specific review copy without a database", { timeout: 180000 }, async () => {
  build();
  const port = await reserveFreePort();
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

  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  const cases = [
    {
      path: "/ux-prototype/dashboard?state=loading",
      includes: ["Loading dashboard", "Preparing priorities, pipeline and work context."]
    },
    {
      path: "/ux-prototype/dashboard?state=empty",
      includes: ["No priorities yet", "The queue is clear and the pipeline is quiet."]
    },
    {
      path: "/ux-prototype/dashboard?state=success",
      includes: ["Review snapshot updated", "Today’s priorities were refreshed"]
    },
    {
      path: "/ux-prototype/daily-work?state=default",
      includes: ["Overdue", "Update", "Next context: short follow-up note"]
    },
    {
      path: "/ux-prototype/leads?state=default",
      includes: ["Search", "All cities", "Priority"]
    },
    {
      path: "/ux-prototype/leads?state=stress",
      includes: ["North Star Wellness and Recovery Center for Local Service Teams and Neighborhood Outreach", "Polaris Produce Market and Local Home Delivery Network"]
    },
    {
      path: "/ux-prototype/leads/lead-aurora-bikes?state=default",
      includes: ["Phone", "Recommended action", "Activity timeline", "Mini-audit", "Technical metadata"]
    },
    {
      path: "/ux-prototype/sales-overview?state=empty",
      includes: ["No sales activity in range", "The selected date range has no qualifying work."]
    },
    {
      path: "/ux-prototype/import-batches?state=default",
      includes: ["Completed with issues", "Processing", "Failed"]
    },
    {
      path: "/ux-prototype/import-batches/batch-2026-06-21?state=default",
      includes: ["Retry", "Download rejected rows", "Row outcomes", "Technical evidence"]
    },
    {
      path: "/ux-prototype/duplicate-candidates?state=default",
      includes: ["confidence", "Compare", "Shared address, same decision maker"]
    },
    {
      path: "/ux-prototype/duplicate-candidates/dup-aurora-bikes?state=default",
      includes: ["Existing record", "Imported record", "Differences to review", "Keep separate", "Mark as same business"]
    },
    {
      path: "/ux-prototype/duplicate-candidates/dup-aurora-bikes?confirm=1",
      includes: ["Confirmation dialog presentation", "Confirm", "Cancel"]
    },
    {
      path: "/ux-prototype/duplicate-candidates/dup-aurora-bikes?state=success",
      includes: ["Success feedback", "A review action was acknowledged in the prototype copy."]
    },
    {
      path: "/ux-prototype/system-status?state=error",
      includes: ["System status unavailable", "The check could not return fresh data."]
    },
    {
      path: "/ux-prototype/system-status?state=default",
      includes: ["Application", "Available", "Environment", "Preview", "Technical details", "Refresh"]
    }
  ] as const;

  try {
    for (const item of cases) {
      const response = await waitForPage(`http://127.0.0.1:${port}${item.path}`);
      const html = await response.text();
      assert.match(html, /UX prototype/);
      assert.match(html, /No data is saved/);
      assert.match(html, /<main/i);
      assert.match(html, /noindex/i);
      for (const expected of item.includes) {
        assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }

    const defaultDuplicate = await (await waitForPage(`http://127.0.0.1:${port}/ux-prototype/duplicate-candidates/dup-aurora-bikes`)).text();
    assert.doesNotMatch(defaultDuplicate, /Success feedback/);

    const defaultLeads = await (await waitForPage(`http://127.0.0.1:${port}/ux-prototype/leads?state=default`)).text();
    assert.doesNotMatch(defaultLeads, /Leads pagination/);
    assert.doesNotMatch(defaultLeads, /aria-label="Previous page"/);
    assert.doesNotMatch(defaultLeads, /aria-label="Next page"/);
  } finally {
    terminateProcessTree(child.pid ?? 0);
  }

  assert.doesNotMatch(output, /Failed to compile|Type error/i);
});

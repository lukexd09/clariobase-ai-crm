import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardPage } from "@/components/dashboard-page";
import { I18nProvider } from "@/i18n/provider";
import { enUS } from "@/i18n/dictionaries/en-US";
import type { DashboardData } from "@/lib/dashboard";

const repoRoot = path.resolve(__dirname, "..");
const read = (filePath: string) => fs.readFileSync(path.join(repoRoot, filePath), "utf8");

const data: DashboardData = {
  operationalDate: "2026-07-21T22:00:00.000Z",
  metrics: [
    { key: "overdue", count: 1 },
    { key: "dueToday", count: 0 },
    { key: "upcoming", count: 2 },
    { key: "noAction", count: 0 }
  ],
  priorities: [{
    id: "lead-42",
    businessName: "North Star Clinic",
    nextActionKey: "sales.status.AUDITED.next",
    statusKey: "taxonomy.AUDITED",
    deadlineAt: "2026-07-22T12:00:00.000Z",
    href: "/leads/lead-42"
  }],
  activeDuplicateCount: 2,
  pipeline: [
    { stageKey: "dashboard.pipeline.intake", value: 3 },
    { stageKey: "dashboard.pipeline.audit", value: 1 },
    { stageKey: "dashboard.pipeline.conversation", value: 2 },
    { stageKey: "dashboard.pipeline.offer", value: 0 },
    { stageKey: "dashboard.pipeline.won", value: 1 }
  ]
};

function renderDashboard(input: DashboardData = data) {
  return renderToStaticMarkup(
    React.createElement(I18nProvider, { locale: "en-US", messages: enUS }, React.createElement(DashboardPage, { data: input }))
  );
}

test("dashboard renders CRM values, direct lead links and active duplicate count", () => {
  const markup = renderDashboard();

  assert.match(markup, /Dashboard/);
  assert.match(markup, /Your priorities for Jul 22, 2026/);
  assert.match(markup, /North Star Clinic/);
  assert.match(markup, /Prepare outreach or follow-up/);
  assert.match(markup, /Audited/);
  assert.match(markup, /href="\/leads\/lead-42"/);
  assert.match(markup, /Potential duplicates requiring review: 2/);
  assert.match(markup, /Intake/);
  assert.match(markup, /Contact and conversation/);
  assert.doesNotMatch(markup, /2026-06-21|Lumina|Aurora|Sienna|Velvet/);
});

test("empty dashboard shows a useful empty state without a duplicate warning", () => {
  const markup = renderDashboard({
    ...data,
    metrics: data.metrics.map((metric) => ({ ...metric, count: 0 })),
    priorities: [],
    activeDuplicateCount: 0,
    pipeline: data.pipeline.map((stage) => ({ ...stage, value: 0 }))
  });

  assert.match(markup, /There are no priorities requiring action/);
  assert.doesNotMatch(markup, /Data quality warning|Potential duplicates requiring review/);
  assert.doesNotMatch(markup, /width:8%/);
});

test("dashboard source stays on approved primitives and canonical tokens", () => {
  const page = read("src/components/dashboard-page.tsx");
  const primitives = read("src/components/dashboard-primitives.tsx");
  const globalsCss = read("src/app/globals.css");

  assert.match(page, /from "@\/components\/dashboard-primitives"/);
  assert.match(page, /from "@\/components\/clariobase-ui"/);
  assert.doesNotMatch(page, /#[0-9A-Fa-f]{3,6}|bg-slate-|text-slate-|border-slate-/);
  assert.doesNotMatch(primitives, /#[0-9A-Fa-f]{3,6}|bg-slate-|text-slate-|border-slate-/);
  assert.match(primitives, /aria-label=\{t\("dashboard\.openCompany", \{ company \}\)\}/);

  const referencedTokens = [...page.matchAll(/var\((--cb-[^)]+)\)/g), ...primitives.matchAll(/var\((--cb-[^)]+)\)/g)].map((match) => match[1]);
  const declaredTokens = new Set([...globalsCss.matchAll(/(--cb-[A-Za-z0-9-]+):/g)].map((match) => match[1]));
  for (const token of referencedTokens) assert.ok(declaredTokens.has(token), `Missing token declaration for ${token}`);
});

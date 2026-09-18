import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  FormMessage,
  Input,
  Label,
  PaginationControls,
  Select,
  Skeleton,
  StatusMessage,
  Surface,
  SurfaceContent,
  SurfaceDescription,
  SurfaceHeader,
  SurfaceTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TableSurface
} from "@/components/clariobase-ui";

function render(node: React.ReactElement) {
  return renderToStaticMarkup(node);
}

test("clariobase ui primitives render the required html contracts", () => {
  const button = render(React.createElement(Button, null, "Save"));
  const disabledButton = render(React.createElement(Button, { disabled: true }, "Save"));
  const buttonLink = render(React.createElement(ButtonLink, { href: "/next" }, "Continue"));
  const input = render(React.createElement(Input, { "aria-label": "Name" }));
  const select = render(
    React.createElement(
      Select,
      { "aria-label": "Type" },
      React.createElement("option", null, "One"),
    ),
  );
  const surface = render(
    React.createElement(
      Surface,
      null,
      React.createElement(
        SurfaceHeader,
        null,
        React.createElement(SurfaceTitle, null, "Overview"),
        React.createElement(SurfaceDescription, null, "Warm, lightweight summary."),
      ),
      React.createElement(SurfaceContent, null, "Body"),
    ),
  );
  const badge = render(React.createElement(Badge, { tone: "success" }, "Complete"));
  const status = render(React.createElement(StatusMessage, { tone: "information", title: "Heads up" }, "A short note."));
  const pagination = render(React.createElement(PaginationControls, { "aria-label": "Pagination" }, React.createElement("div", null, "1")));
  const tableSurface = render(
    React.createElement(
      TableSurface,
      { "aria-label": "Scrollable table" },
      React.createElement(
        Table,
        null,
        React.createElement(
          TableHead,
          null,
          React.createElement("tr", null, React.createElement(TableHeadCell, null, "Name")),
        ),
        React.createElement(TableBody, null, React.createElement(TableRow, null, React.createElement(TableCell, null, "Ada"))),
      ),
    ),
  );
  const emptyState = render(React.createElement(EmptyState, { title: "No items", description: "Nothing here yet." }));
  const label = render(React.createElement(Label, { htmlFor: "name" }, "Name"));
  const formMessage = render(React.createElement(FormMessage, null, "Required"));
  const skeleton = render(React.createElement(Skeleton, { className: "h-4 w-24" }));

  assert.match(button, /<button[^>]*data-slot="button"/);
  assert.match(disabledButton, /<button[^>]*disabled/);
  assert.match(buttonLink, /<a[^>]*data-slot="button-link"/);
  assert.match(input, /<input[^>]*data-slot="input"/);
  assert.match(select, /<select[^>]*>/);
  assert.match(surface, /<section[^>]*data-slot="surface"/);
  assert.match(badge, /Complete/);
  assert.match(status, /role="status"/);
  assert.match(status, /Heads up/);
  assert.match(pagination, /aria-label="Pagination"/);
  assert.match(tableSurface, /role="region"/);
  assert.match(tableSurface, /tabindex="0"/i);
  assert.match(tableSurface, /aria-label="Scrollable table"/);
  assert.match(emptyState, /No items/);
  assert.match(emptyState, /Nothing here yet\./);
  assert.match(label, /data-slot="label"/);
  assert.match(formMessage, /data-slot="form-message"/);
  assert.match(skeleton, /aria-hidden="true"/);
});

test("pure primitive modules do not force a client boundary", () => {
  const files = [
    "src/components/clariobase-ui/button.tsx",
    "src/components/clariobase-ui/field.tsx",
    "src/components/clariobase-ui/surface.tsx",
    "src/components/clariobase-ui/status.tsx",
    "src/components/clariobase-ui/table.tsx",
    "src/components/clariobase-ui/feedback.tsx"
  ];

  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    assert.doesNotMatch(source, /"use client";/);
  }
});

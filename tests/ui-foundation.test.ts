import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CLARIOBASE_UI_TOKENS } from "@/lib/design-tokens";

const repoRoot = path.resolve(__dirname, "..");

function read(filePath: string) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

test("canonical design token contract is documented, exposed and consistent", () => {
  const doc = read("docs/design/clariobase-ui-v1.md");
  const tokens = read("src/lib/design-tokens.ts");
  const globalsCss = read("src/app/globals.css");

  assert.match(doc, /background: '#F7F4EF'/);
  assert.match(doc, /accent: '#AA5E7B'/);
  assert.match(doc, /accentForeground: '#FFFFFF'/);
  assert.match(doc, /successInk: '#22553E'/);
  assert.match(doc, /Legacy-Route Isolation Policy/);
  assert.match(doc, /project-owned primitives from `src\/components\/clariobase-ui\/`/);
  assert.match(doc, /Legacy --clariobase-\* presentation variables remain unchanged for unmigrated routes\./);
  assert.match(doc, /The separate --clariobase-ui-\* variables mirror the canonical UI v1 token inventory\./);
  assert.match(doc, /Project-owned components consume the UI v1 values through the --cb-\* aliases\./);
  assert.match(tokens, /background: "#F7F4EF"/);
  assert.match(tokens, /accent: "#AA5E7B"/);
  assert.match(tokens, /accentForeground: "#FFFFFF"/);
  assert.match(tokens, /successInk: "#22553E"/);
  assert.match(tokens, /dangerInk: "#8E3636"/);
  assert.match(tokens, /neutralInk: "#594F49"/);
  assert.match(globalsCss, /--clariobase-ui-background:\s*#f7f4ef;/);
  assert.match(globalsCss, /--clariobase-ui-surface:\s*#fffdfb;/);
  assert.match(globalsCss, /--clariobase-ui-surface-elevated:\s*#ffffff;/);
  assert.match(globalsCss, /--clariobase-ui-text-primary:\s*#171717;/);
  assert.match(globalsCss, /--clariobase-ui-text-secondary:\s*#6b5f5a;/);
  assert.match(globalsCss, /--clariobase-ui-border:\s*#e5dcd6;/);
  assert.match(globalsCss, /--cb-background:\s*var\(--clariobase-ui-background\)/);
  assert.match(globalsCss, /--cb-surface:\s*var\(--clariobase-ui-surface\)/);
  assert.match(globalsCss, /--cb-elevated-surface:\s*var\(--clariobase-ui-surface-elevated\)/);
  assert.match(globalsCss, /--cb-foreground:\s*var\(--clariobase-ui-text-primary\)/);
  assert.match(globalsCss, /--cb-muted-foreground:\s*var\(--clariobase-ui-text-secondary\)/);
  assert.match(globalsCss, /--cb-border:\s*var\(--clariobase-ui-border\)/);
  assert.match(globalsCss, /--clariobase-accent:\s*#aa5e7b;/);
  assert.match(globalsCss, /--clariobase-accent-foreground:\s*#ffffff;/);
  assert.match(globalsCss, /--clariobase-success-ink:\s*#22553e;/);
  assert.match(globalsCss, /--clariobase-danger-ink:\s*#8e3636;/);
  assert.doesNotMatch(globalsCss, /color-scheme:\s*dark;/);
  assert.doesNotMatch(globalsCss, /var\(--clariobase-surface-elevated\)/);
  assert.doesNotMatch(globalsCss, /var\(--clariobase-ui-[^)]+\)\s*$/m);
});

test("global foundation keeps legacy root presentation while exposing the new foundation", () => {
  const globalsCss = read("src/app/globals.css");

  assert.match(globalsCss, /--clariobase-primary:\s*#006194;/);
  assert.match(globalsCss, /--clariobase-background:\s*#f8fafc;/);
  assert.match(globalsCss, /--clariobase-surface:\s*#ffffff;/);
  assert.match(globalsCss, /--clariobase-surface-subtle:\s*#f1f5f9;/);
  assert.match(globalsCss, /--clariobase-text-primary:\s*#0f172a;/);
  assert.match(globalsCss, /--clariobase-text-secondary:\s*#475569;/);
  assert.match(globalsCss, /--clariobase-border:\s*#cbd5e1;/);
  assert.match(globalsCss, /--cb-background:\s*var\(--clariobase-ui-background\)/);
  assert.doesNotMatch(globalsCss, /radial-gradient/);
  assert.doesNotMatch(globalsCss, /linear-gradient/);
});

test("wcag contrast holds for theme colors used by primitives", () => {
  const colors = CLARIOBASE_UI_TOKENS.color;

  assert.ok(contrastRatio(colors.accentForeground, colors.accent) >= 4.5);
  assert.ok(contrastRatio(colors.accentForeground, colors.accentHover) >= 4.5);
  assert.ok(contrastRatio(colors.accentForeground, colors.accentActive) >= 4.5);
  assert.ok(contrastRatio(colors.primaryText, colors.background) >= 4.5);
  assert.ok(contrastRatio(colors.primaryText, colors.surface) >= 4.5);
  assert.ok(contrastRatio(colors.mutedText, colors.background) >= 4.5);
  assert.ok(contrastRatio(colors.mutedText, colors.surface) >= 4.5);
  assert.ok(contrastRatio(colors.accentForeground, colors.danger) >= 4.5);
});

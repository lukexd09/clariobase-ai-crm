import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export type AuditFinding = { file: string; line: number; value: string; kind: string };
export type HardcodedCopyException = { file: string; value: string; reason: string };

export const HARDCODED_COPY_EXCEPTIONS: readonly HardcodedCopyException[] = [
  { file: "src/components/app-shell.tsx", value: "C", reason: "Brand-mark glyph, hidden from assistive technology." },
  { file: "src/components/app-shell.tsx", value: "ClarioBase", reason: "Product brand name." },
  { file: "src/components/auth/sign-in-form.tsx", value: "ClarioBase", reason: "Product brand name." },
  { file: "src/components/environment-indicator.tsx", value: "TEST", reason: "Invariant safety watermark; its screen-reader description is localized." },
  { file: "src/components/clariobase-ui/status.tsx", value: "i", reason: "Decorative information glyph, hidden from assistive technology." },
  { file: "src/app/duplicates/[id]/page.tsx", value: "&larr;", reason: "Symbol-only back arrow next to a localized label." },
  { file: "src/app/leads/[id]/page.tsx", value: "v", reason: "Decorative chevron glyph, hidden from assistive technology." },
  { file: "src/app/leads/[id]/page.tsx", value: "&rarr;", reason: "Symbol-only forward arrow next to localized content." },
  { file: "src/app/duplicates/[id]/page.tsx", value: "Instagram", reason: "Platform brand name." },
  { file: "src/app/duplicates/[id]/page.tsx", value: "Facebook", reason: "Platform brand name." }
] as const;

const USER_FACING_ATTRIBUTES = new Set([
  "aria-label", "aria-description", "alt", "caption", "description", "emptyDescription",
  "emptyMessage", "emptyTitle", "eyebrow", "heading", "hint", "label", "placeholder", "title"
]);
const USER_FACING_PROPERTIES = new Set(["caption", "description", "eyebrow", "heading", "label", "placeholder", "title"]);

function normalizePath(value: string) {
  return value.replaceAll("\\", "/");
}

function walk(directory: string, extension: string) {
  const output: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(fullPath, extension));
    else if (entry.isFile() && entry.name.endsWith(extension)) output.push(fullPath);
  }
  return output;
}

function sourceFile(filePath: string) {
  return ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true, filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function propertyName(node: ts.PropertyName | undefined) {
  return node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) ? node.text : null;
}

function directPresentationStrings(expression: ts.Expression | undefined): string[] {
  if (!expression) return [];
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return [expression.text];
  if (ts.isTemplateExpression(expression)) {
    return [`${expression.head.text}${expression.templateSpans.map((span) => `{value}${span.literal.text}`).join("")}`];
  }
  if (ts.isParenthesizedExpression(expression)) return directPresentationStrings(expression.expression);
  if (ts.isConditionalExpression(expression)) return [...directPresentationStrings(expression.whenTrue), ...directPresentationStrings(expression.whenFalse)];
  if (ts.isBinaryExpression(expression) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.PlusToken].includes(expression.operatorToken.kind)) {
    return [...directPresentationStrings(expression.left), ...directPresentationStrings(expression.right)];
  }
  return [];
}

function isPresentationText(value: string) {
  return /\p{L}/u.test(value.trim());
}

export function auditHardcodedPresentationCopy(repoRoot = process.cwd()) {
  const findings: AuditFinding[] = [];
  const observedExceptions = new Set<string>();
  const files = [path.join(repoRoot, "src", "app"), path.join(repoRoot, "src", "components")]
    .flatMap((directory) => walk(directory, ".tsx"));

  for (const filePath of files) {
    const source = sourceFile(filePath);
    const file = normalizePath(path.relative(repoRoot, filePath));
    const record = (node: ts.Node, value: string, kind: string) => {
      const normalized = value.replace(/\s+/g, " ").trim();
      if (!isPresentationText(normalized)) return;
      const exceptionKey = `${file}\0${normalized}`;
      if (HARDCODED_COPY_EXCEPTIONS.some((entry) => `${entry.file}\0${entry.value}` === exceptionKey)) {
        observedExceptions.add(exceptionKey);
        return;
      }
      findings.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, value: normalized, kind });
    };

    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node)) record(node, node.text, "jsx-text");
      const attributeName = ts.isJsxAttribute(node) && ts.isIdentifier(node.name) ? node.name.text : null;
      if (ts.isJsxAttribute(node) && attributeName && USER_FACING_ATTRIBUTES.has(attributeName)) {
        if (node.initializer && ts.isStringLiteral(node.initializer)) record(node, node.initializer.text, `jsx-${attributeName}`);
        if (node.initializer && ts.isJsxExpression(node.initializer)) {
          for (const value of directPresentationStrings(node.initializer.expression)) record(node, value, `jsx-${attributeName}`);
        }
      }
      if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) {
        for (const value of directPresentationStrings(node.expression)) record(node, value, "jsx-expression");
      }
      if (ts.isPropertyAssignment(node) && USER_FACING_PROPERTIES.has(propertyName(node.name) ?? "")) {
        for (const value of directPresentationStrings(node.initializer)) record(node, value, `property-${propertyName(node.name)}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  const unusedExceptions = HARDCODED_COPY_EXCEPTIONS.filter((entry) => !observedExceptions.has(`${entry.file}\0${entry.value}`));
  return { findings, unusedExceptions };
}

function unwrapObject(expression: ts.Expression): ts.ObjectLiteralExpression | null {
  if (ts.isObjectLiteralExpression(expression)) return expression;
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) || ts.isParenthesizedExpression(expression)) return unwrapObject(expression.expression);
  return null;
}

function dictionaryEntries(repoRoot: string, relativePath: string, variableName: string) {
  const filePath = path.join(repoRoot, relativePath);
  const source = sourceFile(filePath);
  const find = (node: ts.Node): ts.ObjectLiteralExpression | undefined => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName && node.initializer) {
      return unwrapObject(node.initializer) ?? undefined;
    }
    return ts.forEachChild(node, find);
  };
  const object = find(source);
  if (!object) throw new Error(`Dictionary object ${variableName} not found in ${relativePath}`);
  const entries = new Map<string, string>();
  const duplicates: string[] = [];
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property.name);
    if (!key || !(ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer))) continue;
    if (entries.has(key)) duplicates.push(key);
    entries.set(key, property.initializer.text);
  }
  return { entries, duplicates };
}

function placeholders(value: string) {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
}

export function auditDictionaries(repoRoot = process.cwd()) {
  const english = dictionaryEntries(repoRoot, "src/i18n/dictionaries/en-US.ts", "enUS");
  const polish = dictionaryEntries(repoRoot, "src/i18n/dictionaries/pl-PL.ts", "plPL");
  const englishKeys = [...english.entries.keys()].sort();
  const polishKeys = [...polish.entries.keys()].sort();
  const missingPolish = englishKeys.filter((key) => !polish.entries.has(key));
  const extraPolish = polishKeys.filter((key) => !english.entries.has(key));
  const placeholderMismatches = englishKeys.filter((key) => JSON.stringify(placeholders(english.entries.get(key) ?? "")) !== JSON.stringify(placeholders(polish.entries.get(key) ?? "")));

  const literalKeyFindings: AuditFinding[] = [];
  const sourceFiles = [path.join(repoRoot, "src")].flatMap((directory) => [...walk(directory, ".ts"), ...walk(directory, ".tsx")]);
  for (const filePath of sourceFiles) {
    if (normalizePath(filePath).includes("/src/i18n/dictionaries/")) continue;
    const source = sourceFile(filePath);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t" && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && !english.entries.has(node.arguments[0].text)) {
        literalKeyFindings.push({ file: normalizePath(path.relative(repoRoot, filePath)), line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, value: node.arguments[0].text, kind: "unknown-translation-key" });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  return { englishCount: englishKeys.length, polishCount: polishKeys.length, duplicateEnglish: english.duplicates, duplicatePolish: polish.duplicates, missingPolish, extraPolish, placeholderMismatches, literalKeyFindings, englishKeys };
}

export const TECHNICAL_FORMAT_EXCEPTIONS = [
  { file: "src/i18n/format.ts", value: "en-CA", reason: "Stable numeric parts for datetime-local serialization." },
  { file: "src/lib/form-date-time.ts", value: "en-CA", reason: "Stable Warsaw wall-clock parts for datetime-local parsing." }
] as const;

export function auditPresentationFormatting(repoRoot = process.cwd()) {
  const findings: AuditFinding[] = [];
  const files = [...walk(path.join(repoRoot, "src", "app"), ".ts"), ...walk(path.join(repoRoot, "src", "app"), ".tsx"), ...walk(path.join(repoRoot, "src", "components"), ".ts"), ...walk(path.join(repoRoot, "src", "components"), ".tsx")];
  const fixedFormatter = /new\s+Intl\.(?:DateTimeFormat|NumberFormat)\s*\(\s*["'`][^"'`]+["'`]|\.toLocale(?:DateString|TimeString|String)\s*\(/g;
  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    for (const match of sourceText.matchAll(fixedFormatter)) {
      const before = sourceText.slice(0, match.index ?? 0);
      findings.push({ file: normalizePath(path.relative(repoRoot, filePath)), line: before.split(/\r?\n/).length, value: match[0], kind: "direct-presentation-formatter" });
    }
  }
  return { findings };
}

export function runLocalizationAudit(repoRoot = process.cwd()) {
  return { dictionaries: auditDictionaries(repoRoot), copy: auditHardcodedPresentationCopy(repoRoot), formatting: auditPresentationFormatting(repoRoot) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const result = runLocalizationAudit();
  const failures = result.dictionaries.duplicateEnglish.length + result.dictionaries.duplicatePolish.length + result.dictionaries.missingPolish.length + result.dictionaries.extraPolish.length + result.dictionaries.placeholderMismatches.length + result.dictionaries.literalKeyFindings.length + result.copy.findings.length + result.copy.unusedExceptions.length + result.formatting.findings.length;
  console.log(JSON.stringify({
    status: failures === 0 ? "PASS" : "FAIL",
    dictionaries: { english: result.dictionaries.englishCount, polish: result.dictionaries.polishCount, duplicateEnglish: result.dictionaries.duplicateEnglish, duplicatePolish: result.dictionaries.duplicatePolish, missingPolish: result.dictionaries.missingPolish, extraPolish: result.dictionaries.extraPolish, placeholderMismatches: result.dictionaries.placeholderMismatches, literalKeyFindings: result.dictionaries.literalKeyFindings },
    hardcodedCopy: result.copy,
    formatting: result.formatting
  }, null, 2));
  if (failures > 0) process.exitCode = 1;
}

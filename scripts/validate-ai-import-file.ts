import fs from "node:fs/promises";
import path from "node:path";

import { importFileSchema } from "@/lib/import-contract";

type ValidationIssueLike = {
  path: Array<string | number | symbol>;
  message: string;
};

function flattenIssues(issues: ValidationIssueLike[]) {
  return issues.map((issue) => {
    const rowIndex = typeof issue.path[0] === "number" ? issue.path[0] + 1 : 1;
    const fieldPath = issue.path
      .slice(1)
      .map((segment) => String(segment))
      .join(".");
    return {
      row: rowIndex,
      reason: fieldPath ? `${fieldPath}: ${issue.message}` : issue.message
    };
  });
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error(
      "Usage: pnpm ai:validate-import-file ./data/ai-exchange/inbox/prepared-leads.json"
    );
  }

  const resolvedPath = path.resolve(inputPath);
  const raw = await fs.readFile(resolvedPath, "utf8");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    console.log(`file: ${resolvedPath}`);
    console.log("total rows: 0");
    console.log("valid rows: 0");
    console.log("invalid rows: 1");
    console.log(`row 1: ${error instanceof Error ? error.message : "Invalid JSON"}`);
    process.exitCode = 1;
    return;
  }

  const result = importFileSchema.safeParse(parsedJson);

  if (result.success) {
    console.log(`file: ${resolvedPath}`);
    console.log(`total rows: ${result.data.length}`);
    console.log(`valid rows: ${result.data.length}`);
    console.log("invalid rows: 0");
    return;
  }

  const issues = flattenIssues(result.error.issues);

  console.log(`file: ${resolvedPath}`);
  console.log(
    `total rows: ${Array.isArray(parsedJson) ? parsedJson.length : 0}`
  );
  console.log("valid rows: 0");
  console.log(`invalid rows: ${issues.length}`);
  console.log("row errors:");
  for (const issue of issues) {
    console.log(`  row ${issue.row}: ${issue.reason}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

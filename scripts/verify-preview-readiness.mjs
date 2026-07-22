import fs from "node:fs";
import https from "node:https";
import { pathToFileURL } from "node:url";

const expectedPayload = {
  service: "clariobase-ai-crm",
  status: "ready",
  database: "ok",
  authentication: "ok"
};

export function parseArgs(argv) {
  const values = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const name = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}.`);
    }

    values[name] = value;
    index += 1;
  }

  const caPath = values["ca-path"];
  const hostname = values.hostname;
  const port = Number(values.port);

  if (!caPath) {
    throw new Error("Missing required --ca-path.");
  }
  if (!hostname) {
    throw new Error("Missing required --hostname.");
  }
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("--port must be an integer between 1 and 65535.");
  }

  return { caPath, hostname, port };
}

export function validateReadinessPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Preview readiness payload must be a JSON object.");
  }

  const checks = payload.checks && typeof payload.checks === "object" ? payload.checks : {};
  const actual = {
    service: payload.service,
    status: payload.status,
    database: checks.database,
    authentication: checks.authentication
  };

  for (const [field, expected] of Object.entries(expectedPayload)) {
    if (actual[field] !== expected) {
      throw new Error(`Preview readiness failed: ${field}=${actual[field] ?? "null"}.`);
    }
  }
}

export function buildRequestOptions({ ca, hostname, port }) {
  return {
    hostname: "127.0.0.1",
    port,
    path: "/api/ready",
    method: "GET",
    servername: hostname,
    ca,
    rejectUnauthorized: true,
    headers: {
      Host: `${hostname}:${port}`,
      "Cache-Control": "no-store"
    }
  };
}

export async function verifyPreviewReadiness({ caPath, hostname, port, request = https.request }) {
  const ca = fs.readFileSync(caPath);
  const options = buildRequestOptions({ ca, hostname, port });

  await new Promise((resolve, reject) => {
    const req = request(options, (response) => {
      const chunks = [];

      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("error", reject);
      response.on("end", () => {
        try {
          if (response.statusCode !== 200) {
            throw new Error(`Preview readiness HTTP status was ${response.statusCode}.`);
          }

          let payload;
          try {
            payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            throw new Error("Preview readiness response was not valid JSON.");
          }

          validateReadinessPayload(payload);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function main() {
  try {
    await verifyPreviewReadiness(parseArgs(process.argv.slice(2)));
    console.log("Preview readiness verification passed.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

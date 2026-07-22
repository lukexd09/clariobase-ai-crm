import test, { before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve(__dirname, "..", "scripts", "verify-preview-readiness.mjs")).href;
let readiness: {
  parseArgs: (argv: string[]) => { caPath: string; hostname: string; port: number };
  validateReadinessPayload: (payload: unknown) => void;
  verifyPreviewReadiness: (input: {
    caPath: string;
    hostname: string;
    port: number;
    request: (options: Record<string, unknown>, callback: (response: EventEmitter & { statusCode?: number }) => void) => EventEmitter & { end: () => void };
  }) => Promise<void>;
};

before(async () => {
  readiness = (await import(modulePath)) as typeof readiness;
});

function writeCaFile() {
  const filePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "preview-ca-")), "root.crt");
  fs.writeFileSync(filePath, "test-ca", "utf8");
  return filePath;
}

function goodPayload() {
  return {
    service: "clariobase-ai-crm",
    status: "ready",
    checks: {
      database: "ok",
      authentication: "ok"
    }
  };
}

function mockRequest(statusCode: number, body: string, capture?: (options: Record<string, unknown>) => void) {
  return (options: Record<string, unknown>, callback: (response: EventEmitter & { statusCode?: number }) => void) => {
    capture?.(options);
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => {
      const response = new EventEmitter() as EventEmitter & { statusCode?: number };
      response.statusCode = statusCode;
      callback(response);
      response.emit("data", Buffer.from(body));
      response.emit("end");
    };
    return request;
  };
}

test("parseArgs accepts explicit readiness arguments", () => {
  assert.deepEqual(
    readiness.parseArgs(["--ca-path", "root.crt", "--hostname", "clariobase-crm-preview.home.arpa", "--port", "3001"]),
    {
      caPath: "root.crt",
      hostname: "clariobase-crm-preview.home.arpa",
      port: 3001
    }
  );
});

test("parseArgs rejects missing CA path and invalid ports", () => {
  assert.throws(() => readiness.parseArgs(["--hostname", "example.test", "--port", "3001"]), /--ca-path/);
  assert.throws(() => readiness.parseArgs(["--ca-path", "root.crt", "--hostname", "example.test", "--port", "0"]), /--port/);
  assert.throws(() => readiness.parseArgs(["--ca-path", "root.crt", "--hostname", "example.test", "--port", "abc"]), /--port/);
});

test("verifyPreviewReadiness rejects HTTP errors and invalid JSON", async () => {
  await assert.rejects(
    readiness.verifyPreviewReadiness({
      caPath: writeCaFile(),
      hostname: "clariobase-crm-preview.home.arpa",
      port: 3001,
      request: mockRequest(503, JSON.stringify(goodPayload()))
    }),
    /HTTP status was 503/
  );

  await assert.rejects(
    readiness.verifyPreviewReadiness({
      caPath: writeCaFile(),
      hostname: "clariobase-crm-preview.home.arpa",
      port: 3001,
      request: mockRequest(200, "not-json")
    }),
    /not valid JSON/
  );
});

test("validateReadinessPayload rejects readiness field mismatches", () => {
  assert.throws(() => readiness.validateReadinessPayload({ ...goodPayload(), service: "other" }), /service=other/);
  assert.throws(() => readiness.validateReadinessPayload({ ...goodPayload(), status: "starting" }), /status=starting/);
  assert.throws(
    () => readiness.validateReadinessPayload({ ...goodPayload(), checks: { database: "down", authentication: "ok" } }),
    /database=down/
  );
  assert.throws(
    () => readiness.validateReadinessPayload({ ...goodPayload(), checks: { database: "ok", authentication: "down" } }),
    /authentication=down/
  );
});

test("verifyPreviewReadiness accepts the expected payload", async () => {
  await readiness.verifyPreviewReadiness({
    caPath: writeCaFile(),
    hostname: "clariobase-crm-preview.home.arpa",
    port: 3001,
    request: mockRequest(200, JSON.stringify(goodPayload()))
  });
});

test("request connects to loopback with SNI, Host header, CA, and TLS verification", async () => {
  let options: Record<string, unknown> | undefined;

  await readiness.verifyPreviewReadiness({
    caPath: writeCaFile(),
    hostname: "clariobase-crm-preview.home.arpa",
    port: 3001,
    request: mockRequest(200, JSON.stringify(goodPayload()), (captured) => {
      options = captured;
    })
  });

  assert.equal(options?.hostname, "127.0.0.1");
  assert.equal(options?.servername, "clariobase-crm-preview.home.arpa");
  assert.equal(options?.port, 3001);
  assert.equal(options?.rejectUnauthorized, true);
  assert.deepEqual(options?.headers, {
    Host: "clariobase-crm-preview.home.arpa:3001",
    "Cache-Control": "no-store"
  });
  assert.equal(Buffer.isBuffer(options?.ca), true);
});

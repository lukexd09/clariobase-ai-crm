import { parseAuthRuntimeConfig } from "@/lib/auth-runtime-config";

export const runtimeServiceName = "clariobase-ai-crm";

export type RuntimeReadinessBody = {
  service: typeof runtimeServiceName;
  status: "ready" | "not_ready";
  timestamp: string;
  checks: {
    database: "ok" | "unavailable";
    authentication: "ok" | "misconfigured";
  };
};

export type RuntimeReadinessResult = {
  body: RuntimeReadinessBody;
  httpStatus: 200 | 503;
};

type ReadinessProbe = () => Promise<unknown>;

async function defaultDatabaseProbe() {
  const { prisma } = await import("@/lib/prisma");
  await prisma.importBatch.findFirst({
    select: {
      id: true
    }
  });
}

async function defaultAuthenticationProbe() {
  parseAuthRuntimeConfig();
}

export async function getRuntimeReadiness(
  probeDatabase: ReadinessProbe = defaultDatabaseProbe,
  probeAuthentication: ReadinessProbe = defaultAuthenticationProbe,
  timestampFactory: () => string = () => new Date().toISOString()
): Promise<RuntimeReadinessResult> {
  let database: "ok" | "unavailable" = "unavailable";
  let authentication: "ok" | "misconfigured" = "misconfigured";

  try {
    await probeDatabase();
    database = "ok";
  } catch {
    database = "unavailable";
  }

  try {
    await probeAuthentication();
    authentication = "ok";
  } catch {
    authentication = "misconfigured";
  }

  const ready = database === "ok" && authentication === "ok";

  return {
    httpStatus: ready ? 200 : 503,
    body: {
      service: runtimeServiceName,
      status: ready ? "ready" : "not_ready",
      timestamp: timestampFactory(),
      checks: {
        database,
        authentication
      }
    }
  };
}

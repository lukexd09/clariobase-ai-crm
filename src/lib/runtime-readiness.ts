export const runtimeServiceName = "clariobase-ai-crm";

export type RuntimeReadinessBody = {
  service: typeof runtimeServiceName;
  status: "ready" | "not_ready";
  timestamp: string;
  checks: {
    database: "ok" | "unavailable";
  };
};

export type RuntimeReadinessResult = {
  body: RuntimeReadinessBody;
  httpStatus: 200 | 503;
};

async function defaultProbe() {
  const { prisma } = await import("@/lib/prisma");
  await prisma.$queryRaw`SELECT 1`;
}

export async function getRuntimeReadiness(
  probe: () => Promise<unknown> = defaultProbe,
  timestampFactory: () => string = () => new Date().toISOString()
): Promise<RuntimeReadinessResult> {
  try {
    await probe();

    return {
      httpStatus: 200,
      body: {
        service: runtimeServiceName,
        status: "ready",
        timestamp: timestampFactory(),
        checks: {
          database: "ok"
        }
      }
    };
  } catch {
    return {
      httpStatus: 503,
      body: {
        service: runtimeServiceName,
        status: "not_ready",
        timestamp: timestampFactory(),
        checks: {
          database: "unavailable"
        }
      }
    };
  }
}

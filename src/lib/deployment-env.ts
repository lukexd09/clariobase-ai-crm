export type DeploymentEnv = "production" | "preview" | "unknown";

function normalizeDeploymentEnv(value: string | undefined | null) {
  return value?.trim().toLowerCase();
}

export function resolveDeploymentEnv(value: string | undefined | null): DeploymentEnv {
  const normalized = normalizeDeploymentEnv(value);

  if (normalized === "production") {
    return "production";
  }

  if (normalized === "preview") {
    return "preview";
  }

  return "unknown";
}

export function shouldShowEnvironmentIndicator(value: string | undefined | null): boolean {
  return resolveDeploymentEnv(value) !== "production";
}

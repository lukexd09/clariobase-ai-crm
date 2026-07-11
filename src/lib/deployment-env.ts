export type DeploymentEnv = "production" | "preview" | "unknown";

export function resolveDeploymentEnv(value: string | undefined | null): DeploymentEnv {
  if (value === "production") {
    return "production";
  }

  if (value === "preview") {
    return "preview";
  }

  return "unknown";
}

export function shouldShowEnvironmentIndicator(value: string | undefined | null): boolean {
  return resolveDeploymentEnv(value) !== "production";
}

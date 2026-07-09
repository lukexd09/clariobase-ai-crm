import assert from "node:assert/strict";
import test from "node:test";

import { resolveDeploymentEnv, shouldShowEnvironmentIndicator } from "@/lib/deployment-env";

test("deployment env helper resolves production and fail-safes non-production values", () => {
  assert.equal(resolveDeploymentEnv("production"), "production");
  assert.equal(resolveDeploymentEnv("PRODUCTION"), "production");
  assert.equal(resolveDeploymentEnv(" production "), "production");
  assert.equal(resolveDeploymentEnv("preview"), "preview");
  assert.equal(resolveDeploymentEnv(undefined), "unknown");
  assert.equal(resolveDeploymentEnv(null), "unknown");
  assert.equal(resolveDeploymentEnv(""), "unknown");
  assert.equal(resolveDeploymentEnv("staging"), "unknown");
});

test("deployment env helper only suppresses the marker in production", () => {
  assert.equal(shouldShowEnvironmentIndicator("production"), false);
  assert.equal(shouldShowEnvironmentIndicator("PRODUCTION"), false);
  assert.equal(shouldShowEnvironmentIndicator(" production "), false);
  assert.equal(shouldShowEnvironmentIndicator("preview"), true);
  assert.equal(shouldShowEnvironmentIndicator(undefined), true);
  assert.equal(shouldShowEnvironmentIndicator(null), true);
  assert.equal(shouldShowEnvironmentIndicator(""), true);
  assert.equal(shouldShowEnvironmentIndicator("invalid"), true);
});

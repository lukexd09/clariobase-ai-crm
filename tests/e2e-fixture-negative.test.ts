import test from "node:test";
import assert from "node:assert/strict";

import {
  createFixtureState,
  fixtureCleanupFilter,
  isOwnedFixtureRow
} from "../scripts/e2e-fixture";

test("fixture ownership helpers stay synthetic and run-scoped", () => {
  const state = createFixtureState("e021-t002-test-run");

  assert.equal(state.runId, "e021-t002-test-run");
  assert.equal(state.source, "E2E_PLAYWRIGHT");
  assert.equal(state.customerId, "e2e-e021-t002-test-run");
  assert.equal(state.sourceRecordId, "e021-t002-test-run");
  assert.equal(state.businessName, "E2E Synthetic e021-t002-test-run");
  assert.deepEqual(fixtureCleanupFilter(state.runId), { customerId: "e2e-e021-t002-test-run" });
});

test("fixture ownership rejects stale and unowned synthetic rows", () => {
  const state = createFixtureState("e021-t002-test-run");
  const owned = {
    customerId: state.customerId,
    source: state.source,
    sourceRecordId: state.sourceRecordId,
    businessName: state.businessName
  };

  assert.equal(isOwnedFixtureRow(owned, state), true);
  assert.equal(isOwnedFixtureRow({ ...owned, source: "LEGACY_IMPORT" }, state), false);
  assert.equal(isOwnedFixtureRow({ ...owned, customerId: "e2e-other-run" }, state), false);
  assert.equal(isOwnedFixtureRow({ ...owned, sourceRecordId: "other-run" }, state), false);
  assert.equal(isOwnedFixtureRow({ ...owned, businessName: "Different Lead" }, state), false);
});

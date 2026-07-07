import assert from "node:assert/strict";
import test from "node:test";

import { getSafeRedirectPath } from "@/lib/auth-redirect";

test("rejects unsafe callback targets", () => {
  assert.equal(getSafeRedirectPath("https://evil.example.com"), "/");
  assert.equal(getSafeRedirectPath("//evil.example.com"), "/");
  assert.equal(getSafeRedirectPath("javascript:alert(1)"), "/");
  assert.equal(getSafeRedirectPath("http://evil.example.com/path"), "/");
});

test("accepts only allowlisted internal paths", () => {
  assert.equal(getSafeRedirectPath("/"), "/");
  assert.equal(getSafeRedirectPath("/leads"), "/leads");
  assert.equal(getSafeRedirectPath("/dashboard/"), "/");
  assert.equal(getSafeRedirectPath("/work"), "/");
});

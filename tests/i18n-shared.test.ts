import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../src/i18n/provider";
import { enUS } from "../src/i18n/dictionaries/en-US";
import { plPL } from "../src/i18n/dictionaries/pl-PL";
import { createTranslator } from "../src/i18n/translate";
import { TAXONOMY_TRANSLATION_KEYS, getTaxonomyTranslationKey } from "../src/i18n/taxonomy";
import { StatusPill } from "../src/components/lead-status-pill";
import { ACTIVITY_TYPE_VALUES } from "../src/lib/activity-values";
import {
  DUPLICATE_CANDIDATE_STATUS_VALUES,
  IMPORT_BATCH_STATUS_VALUES,
  IMPORT_ROW_STATUS_VALUES,
  IMPORT_SOURCE_TYPE_VALUES,
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  MINI_AUDIT_STATUS_VALUES,
  OFFER_DRAFT_STATUS_VALUES,
  OUTREACH_CHANNEL_VALUES,
  OUTREACH_DRAFT_STATUS_VALUES,
  PACKAGE_FIT_VALUES
} from "../src/lib/lead-values";
import { ADMIN_USER_NOTICE_KEYS, getAdminUserNoticeTranslationKey } from "../src/lib/admin-user-notices";

const repoRoot = path.resolve(import.meta.dirname, "..");

test("taxonomy maps every current technical value without changing it", () => {
  const values = [
    ...LEAD_STATUS_VALUES, ...LEAD_PRIORITY_VALUES, ...PACKAGE_FIT_VALUES, ...ACTIVITY_TYPE_VALUES,
    ...MINI_AUDIT_STATUS_VALUES, ...OUTREACH_DRAFT_STATUS_VALUES, ...OFFER_DRAFT_STATUS_VALUES,
    ...OUTREACH_CHANNEL_VALUES, ...IMPORT_BATCH_STATUS_VALUES, ...IMPORT_ROW_STATUS_VALUES,
    ...IMPORT_SOURCE_TYPE_VALUES, ...DUPLICATE_CANDIDATE_STATUS_VALUES
  ];
  for (const value of values) {
    assert.equal(TAXONOMY_TRANSLATION_KEYS[value], `taxonomy.${value}`);
  }
  assert.equal(getTaxonomyTranslationKey("FUTURE_VALUE"), "taxonomy.UNKNOWN");
});

test("status pills localize labels while retaining technical styling keys", () => {
  const render = (locale: "en-US" | "pl-PL") => renderToStaticMarkup(
    React.createElement(I18nProvider, { locale, messages: locale === "pl-PL" ? plPL : enUS },
      React.createElement(StatusPill, { value: "DISCOVERY_SCHEDULED", appearance: "light" }))
  );
  assert.match(render("en-US"), />Discovery scheduled</);
  assert.match(render("pl-PL"), />Rozmowa zaplanowana</);
  assert.doesNotMatch(render("pl-PL"), />DISCOVERY_SCHEDULED</);
});

test("admin notice codes remain stable and resolve only to translation keys", () => {
  const polish = createTranslator("pl-PL");
  assert.deepEqual(Object.keys(ADMIN_USER_NOTICE_KEYS), [
    "user_created", "identity_updated", "user_disabled", "user_reactivated", "password_reset",
    "all_sessions_revoked", "session_revoked", "invalid_new_user_fields", "invalid_identity_fields",
    "invalid_user", "invalid_session", "invalid_password_length", "user_not_found", "session_not_found",
    "self_lockout", "last_active_admin", "invalid_admin_user", "unauthorized", "forbidden",
    "admin_provider_error", "admin_operation_failed"
  ]);
  assert.equal(polish(getAdminUserNoticeTranslationKey("user_created")), "Utworzono użytkownika");
  assert.equal(getAdminUserNoticeTranslationKey("unknown"), "notice.admin.admin_operation_failed");
});

test("shared auth copy uses provider translations without changing auth calls or routes", () => {
  const signIn = fs.readFileSync(path.join(repoRoot, "src/components/auth/sign-in-form.tsx"), "utf8");
  const signOut = fs.readFileSync(path.join(repoRoot, "src/components/auth/sign-out-button.tsx"), "utf8");
  assert.match(signIn, /useI18n/);
  assert.match(signIn, /authClient\.signIn\.email/);
  assert.match(signIn, /callbackURL: returnTo/);
  assert.match(signOut, /authClient\.signOut/);
  assert.match(signOut, /router\.push\("\/sign-in"\)/);
});

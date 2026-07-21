import test from "node:test";
import assert from "node:assert/strict";
import { createMiniAuditDraftFormSchema, miniAuditDraftFormSchema } from "../src/lib/mini-audit-form";
import { createOutreachDraftFormSchema, outreachDraftFormSchema } from "../src/lib/outreach-draft-form";

test("mini-audit draft schema accepts a complete draft", () => {
  const result = miniAuditDraftFormSchema.safeParse({
    status: "READY_FOR_REVIEW",
    problem1: "Weak presence",
    problem2: "Low review volume",
    problem3: "No clear CTA",
    recommendation: "Prioritize a fast website refresh",
    suggestedPackage: "CLARITY",
    outreachAngle: "Show the booking gap",
    draftMessage: "Hello, we noticed...",
    riskNotes: "May need a quick objection response",
    approvedAt: "2026-06-10T09:00"
  });

  assert.equal(result.success, true);
});

test("mini-audit draft schema rejects empty content", () => {
  const result = miniAuditDraftFormSchema.safeParse({
    status: "DRAFT",
    problem1: "",
    problem2: "",
    problem3: "",
    recommendation: "",
    suggestedPackage: "BASE",
    outreachAngle: "",
    draftMessage: "",
    riskNotes: "",
    approvedAt: ""
  });

  assert.equal(result.success, false);
});

test("mini-audit draft schema preserves unchanged existing fold instant", () => {
  const existing = new Date("2026-10-25T01:30:00.000Z");
  const result = createMiniAuditDraftFormSchema({ approvedAt: existing }).safeParse({
    draftId: "mini_123",
    status: "READY_FOR_REVIEW",
    problem1: "Weak presence",
    problem2: "",
    problem3: "",
    recommendation: "",
    suggestedPackage: "CLARITY",
    outreachAngle: "",
    draftMessage: "",
    riskNotes: "",
    approvedAt: "2026-10-25T02:30",
    approvedAtOriginal: existing.toISOString()
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.approvedAt?.toISOString(), existing.toISOString());
});

test("outreach draft schema accepts a complete draft", () => {
  const result = outreachDraftFormSchema.safeParse({
    status: "DRAFT",
    channel: "INSTAGRAM_DM",
    subject: "Quick idea",
    openingHook: "Loved your recent posts",
    message: "I had a look at your profile...",
    callToAction: "Would you like a quick audit?",
    notes: "Prepared for manual sending",
    sentAt: "2026-06-10T10:30",
    miniAuditDraftId: "mini_123"
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.miniAuditDraftId, "mini_123");
});

test("outreach draft schema normalizes empty mini-audit link to null", () => {
  const result = outreachDraftFormSchema.safeParse({
    status: "READY",
    channel: "EMAIL",
    subject: "Quick idea",
    openingHook: "Hello",
    message: "I had a look at your profile...",
    callToAction: "Would you like a quick audit?",
    notes: "",
    sentAt: "",
    miniAuditDraftId: ""
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.miniAuditDraftId, null);
});

test("outreach draft schema rejects invalid channels", () => {
  const result = outreachDraftFormSchema.safeParse({
    status: "READY",
    channel: "WHATSAPP",
    subject: "",
    openingHook: "",
    message: "",
    callToAction: "",
    notes: "",
    sentAt: ""
  });

  assert.equal(result.success, false);
});

test("outreach draft schema rejects empty messages", () => {
  const result = outreachDraftFormSchema.safeParse({
    status: "READY",
    channel: "EMAIL",
    subject: "Follow up",
    openingHook: "Hello",
    message: "",
    callToAction: "Reply if interested",
    notes: "",
    sentAt: ""
  });

  assert.equal(result.success, false);
});

test("outreach draft schema rejects tampered original fold instant", () => {
  const existing = new Date("2026-10-25T01:30:00.000Z");
  const result = createOutreachDraftFormSchema({ sentAt: existing }).safeParse({
    draftId: "outreach_123",
    status: "READY",
    channel: "EMAIL",
    subject: "Follow up",
    openingHook: "Hello",
    message: "I had a look at your profile...",
    callToAction: "Reply if interested",
    notes: "",
    sentAt: "2026-10-25T02:30",
    sentAtOriginal: "2026-10-25T00:30:00.000Z"
  });

  assert.equal(result.success, false);
});

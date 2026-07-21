import test from "node:test";
import assert from "node:assert/strict";
import { createOfferDraftFormSchema, offerDraftFormSchema } from "../src/lib/offer-draft-form";

test("offer draft schema accepts a complete draft", () => {
  const result = offerDraftFormSchema.safeParse({
    status: "READY",
    title: "Clarity launch package for Aurora Nail Studio",
    packageFit: "CLARITY",
    priceNet: "1490.00",
    currency: "pln",
    scopeSummary: "Homepage refresh, booking flow and offer framing",
    assumptions: "Existing content stays in place",
    nextStep: "Review with the lead and finalize wording",
    validUntil: "2026-06-20T12:00",
    sentAt: "",
    acceptedAt: "",
    rejectedAt: "",
    rejectionReason: ""
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.currency, "PLN");
  assert.equal(result.data.priceNet, 1490);
});

test("offer draft schema rejects invalid prices and empty titles", () => {
  const result = offerDraftFormSchema.safeParse({
    status: "DRAFT",
    title: "",
    packageFit: "BASE",
    priceNet: "-10",
    currency: "",
    scopeSummary: "",
    assumptions: "",
    nextStep: "",
    validUntil: "",
    sentAt: "",
    acceptedAt: "",
    rejectedAt: "",
    rejectionReason: ""
  });

  assert.equal(result.success, false);
});

test("offer draft schema preserves the baseline three-character currency contract", () => {
  const result = offerDraftFormSchema.safeParse({
    status: "DRAFT",
    title: "Existing custom currency offer",
    packageFit: "BASE",
    priceNet: "10",
    currency: "123"
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.currency, "123");
});

test("offer draft schema preserves unchanged existing fold instants for every date field", () => {
  const first = new Date("2026-10-25T00:30:00.000Z");
  const second = new Date("2026-10-25T01:30:00.000Z");
  const result = createOfferDraftFormSchema({
    validUntil: first,
    sentAt: second,
    acceptedAt: first,
    rejectedAt: second
  }).safeParse({
    draftId: "offer_123",
    status: "READY",
    title: "Clarity launch package",
    packageFit: "CLARITY",
    priceNet: "",
    currency: "PLN",
    scopeSummary: "",
    assumptions: "",
    nextStep: "",
    validUntil: "2026-10-25T02:30",
    validUntilOriginal: first.toISOString(),
    sentAt: "2026-10-25T02:30",
    sentAtOriginal: second.toISOString(),
    acceptedAt: "2026-10-25T02:30",
    acceptedAtOriginal: first.toISOString(),
    rejectedAt: "2026-10-25T02:30",
    rejectedAtOriginal: second.toISOString(),
    rejectionReason: ""
  });

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.validUntil?.toISOString(), first.toISOString());
  assert.equal(result.data.sentAt?.toISOString(), second.toISOString());
  assert.equal(result.data.acceptedAt?.toISOString(), first.toISOString());
  assert.equal(result.data.rejectedAt?.toISOString(), second.toISOString());
});

test("offer draft schema rejects changed ambiguous fold values", () => {
  const existing = new Date("2026-10-25T01:30:00.000Z");
  const result = createOfferDraftFormSchema({ sentAt: existing }).safeParse({
    status: "READY",
    title: "Clarity launch package",
    packageFit: "CLARITY",
    priceNet: "",
    currency: "PLN",
    sentAt: "2026-10-25T02:45",
    sentAtOriginal: existing.toISOString()
  });

  assert.equal(result.success, false);
});

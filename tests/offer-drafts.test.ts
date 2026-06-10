import test from "node:test";
import assert from "node:assert/strict";
import { offerDraftFormSchema } from "../src/lib/offer-draft-form";

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

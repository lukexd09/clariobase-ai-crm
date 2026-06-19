import { LeadPriority, LeadStatus, PackageFit } from "@/generated/prisma/enums";
import { z } from "zod";

export const importRowSchema = z.object({
  customerId: z.string().trim().min(1).optional(),
  businessName: z.string().trim().min(1),
  category: z.string().trim().min(1).optional().nullable(),
  city: z.string().trim().min(1).optional().nullable(),
  region: z.string().trim().min(1).optional().nullable(),
  country: z.string().trim().min(1).optional().nullable(),
  source: z.string().trim().min(1).optional().nullable(),
  sourceRecordId: z.string().trim().min(1).optional().nullable(),
  googlePlaceId: z.string().trim().min(1).optional().nullable(),
  websiteUrl: z.string().trim().min(1).url().optional().nullable(),
  instagramUrl: z.string().trim().min(1).url().optional().nullable(),
  facebookUrl: z.string().trim().min(1).url().optional().nullable(),
  phone: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().min(1).email().optional().nullable(),
  address: z.string().trim().min(1).optional().nullable(),
  leadStatus: z.nativeEnum(LeadStatus).optional().nullable(),
  priority: z.nativeEnum(LeadPriority).optional().nullable(),
  packageFit: z.nativeEnum(PackageFit).optional().nullable(),
  scoreTotal: z.number().int().optional().nullable(),
  scoreLabel: z.string().trim().min(1).optional().nullable(),
  nextActionAt: z.string().datetime().optional().nullable(),
  lastReviewedAt: z.string().datetime().optional().nullable(),
  lastImportedAt: z.string().datetime().optional().nullable()
});

export const importFileSchema = z.array(importRowSchema);

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportFile = z.infer<typeof importFileSchema>;

export function safeParseImportFile(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return importFileSchema.safeParse(parsed);
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error : new Error("Invalid JSON")
    };
  }
}

export function parseImportFile(raw: string): ImportFile {
  const parsed = safeParseImportFile(raw);

  if (!parsed.success) {
    throw parsed.error instanceof Error ? parsed.error : new Error("Invalid import file");
  }

  return parsed.data;
}

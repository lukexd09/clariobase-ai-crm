import { LeadPriority, LeadStatus, PackageFit } from "@prisma/client";
import { z } from "zod";

const leadStatusValues = Object.values(LeadStatus);
const leadPriorityValues = Object.values(LeadPriority);
const packageFitValues = Object.values(PackageFit);

export const leadUpdateSchema = z.object({
  leadStatus: z.enum(leadStatusValues as [LeadStatus, ...LeadStatus[]]),
  priority: z.enum(leadPriorityValues as [LeadPriority, ...LeadPriority[]]),
  packageFit: z.enum(packageFitValues as [PackageFit, ...PackageFit[]]),
  nextActionAt: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "string") return new Date(value);
    return value;
  }, z.date().nullable()).refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: "Next action date must be a valid date"
    })
});

export type LeadUpdateFormData = z.infer<typeof leadUpdateSchema>;

import { getWorkbenchBucketCounts as getWorkbenchBucketCountsFromWorkView } from "@/lib/work-view";
import type { WorkLead, WorkBucketName } from "@/lib/work-view";

type CountEntry<K extends string> = {
  key: K;
  count: number;
};

export function toCountMap<const Keys extends readonly string[]>(
  keys: Keys,
  entries: Array<CountEntry<Keys[number]>>
) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<Keys[number], number>;

  for (const entry of entries) {
    counts[entry.key] = entry.count;
  }

  return counts;
}

export function getWorkbenchBucketCounts(leads: WorkLead[], now = new Date()) {
  return getWorkbenchBucketCountsFromWorkView(leads, now);
}

export type { WorkBucketName };

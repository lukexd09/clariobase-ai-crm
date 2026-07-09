import React from "react";

import { shouldShowEnvironmentIndicator } from "@/lib/deployment-env";

export function EnvironmentIndicator() {
  if (!shouldShowEnvironmentIndicator(process.env.CRM_DEPLOYMENT_ENV)) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 border-b border-[color:var(--cb-warning)]/30 bg-[color:var(--cb-warning)]/10 text-[color:var(--cb-foreground)] shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-start gap-3 px-4 py-3 min-[768px]:px-6 min-[1024px]:px-8">
        <p className="text-sm font-semibold leading-6">
          TEST ENVIRONMENT — data in this environment may be reset or deleted.
        </p>
      </div>
      <div className="pointer-events-none select-none overflow-hidden border-t border-[color:var(--cb-warning)]/15 px-4 py-6 min-[768px]:px-6 min-[1024px]:px-8">
        <div
          aria-hidden="true"
          className="text-center text-[clamp(4rem,16vw,10rem)] font-black uppercase tracking-[0.28em] text-[color:var(--cb-warning)]/12"
          style={{ transform: "rotate(-18deg)" }}
        >
          TEST
        </div>
      </div>
    </div>
  );
}

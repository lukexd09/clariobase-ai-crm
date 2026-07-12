import React from "react";

import { shouldShowEnvironmentIndicator } from "@/lib/deployment-env";

const watermarkMarks = [
  { left: "10%", top: "12%" },
  { left: "78%", top: "14%" },
  { left: "30%", top: "34%" },
  { left: "70%", top: "42%" },
  { left: "18%", top: "64%" },
  { left: "54%", top: "58%" },
  { left: "86%", top: "76%" },
  { left: "40%", top: "86%" }
] as const;

export function EnvironmentIndicator() {
  if (!shouldShowEnvironmentIndicator(process.env.CRM_DEPLOYMENT_ENV)) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
      <div className="absolute inset-0">
        {watermarkMarks.map((mark) => (
          <span
            key={`${mark.left}-${mark.top}`}
            className="absolute inline-flex items-center justify-center whitespace-nowrap text-[clamp(0.7rem,1vw+0.4rem,1rem)] font-black uppercase tracking-[0.42em] text-[color:var(--cb-neutral)] opacity-[0.16]"
            style={{
              left: mark.left,
              top: mark.top,
              transform: "translate(-50%, -50%) rotate(-18deg)"
            }}
          >
            TEST
          </span>
        ))}
      </div>
    </div>
  );
}

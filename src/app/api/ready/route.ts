import { NextResponse } from "next/server";

import { getRuntimeReadiness } from "@/lib/runtime-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getRuntimeReadiness();

  return NextResponse.json(readiness.body, {
    status: readiness.httpStatus,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

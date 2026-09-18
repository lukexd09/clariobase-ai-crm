import { Suspense } from "react";
import React from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { DashboardPage } from "@/components/dashboard-page";
import { buildDashboardData } from "@/lib/dashboard";
import { getActiveDuplicateCandidateCount } from "@/lib/duplicates";
import { getLeads } from "@/lib/leads";

export default async function HomePage() {
  const { getCurrentUser } = await import("@/lib/auth-context");
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const now = new Date();
    const [leads, activeDuplicateCount] = await Promise.all([
      getLeads(),
      getActiveDuplicateCandidateCount()
    ]);
    const dashboard = buildDashboardData(leads, activeDuplicateCount, now);

    return <DashboardPage data={dashboard} />;
  }

  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

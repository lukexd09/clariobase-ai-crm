import { Suspense } from "react";
import React from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { DashboardPage } from "@/components/dashboard-page";

export default async function HomePage() {
  const { getCurrentUser } = await import("@/lib/auth-context");
  const currentUser = await getCurrentUser();

  if (currentUser) {
    return <DashboardPage />;
  }

  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

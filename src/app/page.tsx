import React from "react";
import { DashboardDataQualityAlert, MetricCard, PipelineSnapshot, PriorityItem } from "@/components/dashboard-primitives";
import { Surface, SurfaceContent, SurfaceHeader, SurfaceTitle } from "@/components/clariobase-ui";

const priorities = [
  {
    company: "Lumina PMU Studio",
    action: "Send revised proposal",
    context: "The owner asked for the Essential package and confirmation that hosting is included.",
    deadline: "Today, 15:30",
    href: "/leads"
  },
  {
    company: "Aurora Nail Studio",
    action: "Confirm booking flow",
    context: "The current enquiry form has too many steps before a customer can request an appointment.",
    deadline: "Tomorrow, 09:00",
    href: "/leads"
  },
  {
    company: "Sienna Dental Care",
    action: "Send mini-audit summary",
    context: "The discovery call was completed yesterday and the client is waiting for recommendations.",
    deadline: "Today, 16:00",
    href: "/leads"
  },
  {
    company: "Velvet Brows & Lashes",
    action: "Schedule the next follow-up",
    context: "No next action was created after the proposal was sent.",
    deadline: "No deadline",
    href: "/leads"
  }
] as const;

const pipeline = [
  { stage: "New", value: 18 },
  { stage: "Contacted", value: 12 },
  { stage: "Qualified", value: 7 },
  { stage: "Proposal sent", value: 5 },
  { stage: "Won", value: 2 }
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--cb-foreground)]">Dashboard</h1>
        <p className="text-sm leading-6 text-[color:var(--cb-muted-foreground)]">Your priorities for 21 June 2026</p>
      </header>

      <section className="space-y-3">
        <dl aria-label="Dashboard metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Overdue" value="2" tone="danger" />
          <MetricCard label="Due today" value="4" tone="warning" />
          <MetricCard label="Upcoming" value="11" tone="information" />
          <MetricCard label="No next action" value="6" tone="neutral" />
        </dl>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <Surface aria-labelledby="dashboard-priorities-heading">
          <SurfaceHeader>
            <SurfaceTitle id="dashboard-priorities-heading">Today&apos;s priorities</SurfaceTitle>
          </SurfaceHeader>
          <SurfaceContent className="divide-y divide-[color:var(--cb-border)]">
            <ol className="list-none">
              {priorities.map((item) => (
                <li key={item.company}>
                  <PriorityItem {...item} />
                </li>
              ))}
            </ol>
          </SurfaceContent>
        </Surface>

        <div className="space-y-5">
          <DashboardDataQualityAlert />
          <PipelineSnapshot items={pipeline} />
        </div>
      </section>
    </div>
  );
}

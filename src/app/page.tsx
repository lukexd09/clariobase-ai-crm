import React from "react";
import { Alert, MetricCard, PageHeader, PipelineSnapshot, PriorityItem } from "@/components/dashboard-primitives";
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
      <PageHeader title="Dashboard" subtitle="Your priorities for 21 June 2026" />

      <section aria-labelledby="dashboard-kpis" className="space-y-3">
        <h2 id="dashboard-kpis" className="text-lg font-semibold text-[color:var(--cb-foreground)]">
          Operational snapshot
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Overdue" value="2" tone="danger" />
          <MetricCard label="Due today" value="4" tone="warning" />
          <MetricCard label="Upcoming" value="11" tone="information" />
          <MetricCard label="No next action" value="6" tone="neutral" />
        </dl>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <Surface>
          <SurfaceHeader>
            <SurfaceTitle>Today&apos;s priorities</SurfaceTitle>
          </SurfaceHeader>
          <SurfaceContent className="divide-y divide-[color:var(--cb-border)]">
            {priorities.map((item) => (
              <PriorityItem key={item.company} {...item} />
            ))}
          </SurfaceContent>
        </Surface>

        <div className="space-y-5">
          <Alert
            title="Data quality warning"
            body="3 possible duplicates need review"
            actionHref="/duplicates"
            actionLabel="Review"
            tone="warning"
          />
          <PipelineSnapshot items={pipeline} />
        </div>
      </section>
    </div>
  );
}

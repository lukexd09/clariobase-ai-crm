import Link from "next/link";
import {
  Alert,
  MetricCard,
  PageHeader,
  PipelineSnapshot,
  PriorityItem,
  StatusBadge
} from "@/components/dashboard-primitives";

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
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your priorities for 21 June 2026" />

      <Alert
        title="Data quality warning"
        body="3 possible duplicates need review"
        actionHref="/duplicates"
        actionLabel="Review duplicates"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overdue" value="2" />
        <MetricCard label="Due today" value="4" />
        <MetricCard label="Upcoming" value="11" />
        <MetricCard label="No next action" value="6" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="space-y-4 rounded-xl border border-[#CBD5E1] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[#0F172A]">Today&apos;s priorities</h2>
            <StatusBadge>4 active tasks</StatusBadge>
          </div>
          <div className="space-y-3">
            {priorities.map((item) => (
              <PriorityItem key={item.company} {...item} />
            ))}
          </div>
        </div>

        <PipelineSnapshot items={pipeline} />
      </section>
    </div>
  );
}

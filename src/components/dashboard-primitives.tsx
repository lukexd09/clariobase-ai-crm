import Link from "next/link";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-[1.7rem] font-semibold tracking-tight text-[#0F172A] min-[760px]:text-[1.8rem] min-[1100px]:text-[2rem]">
        {title}
      </h1>
      <p className="text-sm text-[#475569] min-[760px]:text-base">{subtitle}</p>
    </header>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-3.5 max-[359px]:rounded-none max-[359px]:border-0 max-[359px]:bg-transparent max-[359px]:px-0 max-[359px]:py-0 min-[360px]:rounded-none min-[360px]:border-0 min-[360px]:bg-transparent min-[360px]:px-0 min-[360px]:py-0 min-[760px]:rounded-xl min-[760px]:border min-[760px]:bg-white min-[760px]:px-4 min-[760px]:py-3.5">
      <div className="max-[359px]:flex max-[359px]:min-h-[50px] max-[359px]:items-center max-[359px]:justify-between max-[359px]:gap-4 max-[359px]:px-4 max-[359px]:py-0 min-[360px]:flex min-[360px]:min-h-[70px] min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-4 min-[360px]:px-4 min-[360px]:py-0 min-[760px]:block">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#475569] max-[359px]:text-[11px] max-[359px]:tracking-[0.14em] min-[360px]:text-[11px] min-[360px]:tracking-[0.14em] min-[760px]:text-xs min-[760px]:tracking-[0.16em]">
          {label}
        </p>
        <p className="text-[1.95rem] font-semibold tracking-tight text-[#0F172A] tabular-nums max-[359px]:text-[1.25rem] min-[360px]:text-[1.25rem] min-[760px]:mt-2 min-[760px]:text-[1.95rem]">
          {value}
        </p>
      </div>
    </div>
  );
}

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-[#CBD5E1] bg-[#F1F5F9] px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#475569]">
      {children}
    </span>
  );
}

export function PriorityItem({
  company,
  action,
  context,
  deadline,
  href
}: {
  company: string;
  action: string;
  context: string;
  deadline: string;
  href: string;
}) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-start sm:justify-between max-[759px]:gap-2 max-[759px]:pt-3">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-base font-semibold text-[#0F172A]">
            <Link
              href={href}
              prefetch={false}
              className="rounded-sm text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {company}
            </Link>
          </h3>
          <p className="text-sm font-medium text-[#0F172A]">{action}</p>
          <p className="text-sm leading-6 text-[#475569]">{context}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end max-[759px]:items-start">
          <p className="text-sm text-[#475569]">
            <span className="font-medium text-[#0F172A]">Deadline:</span> {deadline}
          </p>
          <Link
            href={href}
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm font-medium text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white max-[759px]:border-0 max-[759px]:bg-transparent max-[759px]:px-0 max-[759px]:font-semibold"
          >
            Open →
          </Link>
        </div>
      </div>
    </article>
  );
}

type AlertTone = "warning" | "error" | "info";

const alertToneStyles: Record<AlertTone, { wrapper: string; title: string; body: string; button: string }> = {
  warning: {
    wrapper: "border-[#B45309] bg-[#FFFBEB]",
    title: "text-[#B45309]",
    body: "text-[#0F172A]",
    button: "bg-[#B45309] text-white"
  },
  error: {
    wrapper: "border-[#B91C1C] bg-[#FEF2F2]",
    title: "text-[#B91C1C]",
    body: "text-[#0F172A]",
    button: "bg-[#B91C1C] text-white"
  },
  info: {
    wrapper: "border-[#CBD5E1] bg-white",
    title: "text-[#0F172A]",
    body: "text-[#475569]",
    button: "bg-[#006194] text-white"
  }
};

export function Alert({
  title,
  body,
  actionHref,
  actionLabel,
  tone = "info"
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
  tone?: AlertTone;
}) {
  const styles = alertToneStyles[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles.wrapper}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
          <p className={`mt-1 text-sm ${styles.body}`}>{body}</p>
        </div>
        <Link
          href={actionHref}
          prefetch={false}
          className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${styles.button}`}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export function PipelineSnapshot({ items }: { items: readonly { stage: string; value: number }[] }) {
  return (
    <section className="rounded-xl border border-[#CBD5E1] bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-[#0F172A]">Pipeline snapshot</h2>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                {item.stage}
              </span>
              <span className="font-semibold text-[#0F172A] tabular-nums">{item.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F1F5F9]">
              <div
                className="h-1.5 rounded-full bg-[#006194]"
                style={{ width: `${Math.max(8, Math.min(100, item.value * 5))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


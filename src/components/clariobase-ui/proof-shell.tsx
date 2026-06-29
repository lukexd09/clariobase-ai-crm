import Link from "next/link";
import { NAVIGATION_GROUPS, isNavigationItemActive } from "@/lib/navigation";

type ProofShellProps = {
  pathname: string;
  children: React.ReactNode;
};

export function ProofShell({ pathname, children }: ProofShellProps) {
  return (
    <div
      data-ui-foundation="shadboard-proof"
      className="min-h-screen bg-[var(--cb-ui-background)] text-[var(--cb-ui-foreground)]"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-surface)]/95 px-4 py-4 backdrop-blur lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex w-full rounded-[var(--cb-ui-radius-lg)] border border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] px-4 py-3 transition hover:border-[color:var(--cb-ui-primary)]/40 hover:bg-[color:var(--cb-ui-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]"
          >
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold">ClarioBase CRM</span>
              <span className="block text-xs text-[color:var(--cb-ui-muted-foreground)]">
                Shadboard proof boundary
              </span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="mt-6 space-y-5">
            {NAVIGATION_GROUPS.map((group) => (
              <section key={group.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--cb-ui-muted-foreground)]">
                  {group.title}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const active = isNavigationItemActive(item.href, pathname);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex items-center gap-3 rounded-[var(--cb-ui-radius-md)] border px-3 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-background)]",
                          active
                            ? "border-[color:var(--cb-ui-primary)]/25 bg-[color:var(--cb-ui-primary)]/10 text-[color:var(--cb-ui-foreground)]"
                            : "border-transparent bg-[color:var(--cb-ui-surface)] text-[color:var(--cb-ui-muted-foreground)] hover:border-[color:var(--cb-ui-border)] hover:bg-[color:var(--cb-ui-card)] hover:text-[color:var(--cb-ui-foreground)]"
                        ].join(" ")}
                      >
                        <span
                          aria-hidden="true"
                          className={[
                            "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border",
                            active
                              ? "border-[color:var(--cb-ui-primary)] bg-[color:var(--cb-ui-primary)]"
                              : "border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-border)]"
                          ].join(" ")}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{item.label}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemActive, NAVIGATION_GROUPS } from "@/lib/navigation";

function navigationItemClass(active: boolean) {
  return [
    "flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    active
      ? "border-[#CBD5E1] bg-[#F1F5F9] text-[#0F172A]"
      : "border-transparent bg-white text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
  ].join(" ");
}

function NavigationLinks({ pathname, compact = false }: { pathname: string; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {NAVIGATION_GROUPS.map((group) => (
        <section key={group.title} className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#475569]">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isNavigationItemActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={navigationItemClass(active)}
                >
                  <span className="min-w-0 flex-1">
                    <span className={active ? "block font-semibold" : "block font-medium"}>
                      {item.label}
                    </span>
                    {"description" in item && item.description ? (
                      <span className="mt-0.5 block text-xs leading-5 text-[#475569]">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {active ? (
                    <span className="inline-flex shrink-0 rounded-full border border-[#CBD5E1] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0F172A]">
                      Current
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] min-[1100px]:grid min-[1100px]:grid-cols-[clamp(220px,16vw,260px)_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#CBD5E1] bg-white min-[1100px]:sticky min-[1100px]:top-0 min-[1100px]:flex min-[1100px]:h-screen min-[1100px]:flex-col">
        <div className="border-b border-[#CBD5E1] px-[clamp(16px,2vw,32px)] py-5">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#006194] text-sm font-bold text-white">
              C
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-semibold leading-none text-[#0F172A]">ClarioBase</span>
              <span className="mt-1 block text-sm text-[#475569]">Single Operator CRM</span>
            </span>
          </Link>
        </div>
        <nav aria-label="Primary navigation" className="flex-1 space-y-6 px-[clamp(16px,2vw,32px)] py-5">
          <NavigationLinks pathname={pathname} />
        </nav>
        <div className="border-t border-[#CBD5E1] px-[clamp(16px,2vw,32px)] py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2E8F0] text-sm font-semibold text-[#0F172A]">
                ŁC
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F172A]">Łukasz Chmiel</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#475569]">Operator</p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[#475569] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-[#CBD5E1] bg-white">
          <div className="flex min-h-[64px] items-center justify-between gap-4 px-[clamp(16px,2vw,32px)]">
            <div className="min-w-0" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-label="Notifications"
              >
                🔔
              </button>
              <span className="hidden h-8 w-px bg-[#CBD5E1] sm:block" aria-hidden="true" />
              <div className="hidden items-center gap-2 text-sm text-[#475569] sm:flex">
                <span aria-hidden="true">📅</span>
                <span>21 June 2026</span>
              </div>
              <details className="group relative min-[1100px]:hidden">
                <summary className="list-none rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                  Menu
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-[min(90vw,320px)] rounded-xl border border-[#CBD5E1] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  <nav aria-label="Compact navigation" className="space-y-3">
                    <NavigationLinks pathname={pathname} compact />
                  </nav>
                  <div className="mt-4 border-t border-[#CBD5E1] pt-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2E8F0] text-sm font-semibold text-[#0F172A]">
                        ŁC
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">Łukasz Chmiel</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-[#475569]">Operator</p>
                      </div>
                    </div>
                    <button type="button" className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm font-medium text-[#475569]">
                      Sign out
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-[clamp(16px,2vw,32px)] py-6">{children}</main>
      </div>
    </div>
  );
}

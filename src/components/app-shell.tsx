"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Database,
  LayoutDashboard,
  Menu,
  Route,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/clariobase-ui";
import { cn } from "@/lib/utils";
import { isNavigationItemActive, NAVIGATION_GROUPS, type NavigationIconKey } from "@/lib/navigation";

const iconMap: Record<NavigationIconKey, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  dashboard: LayoutDashboard,
  work: Sparkles,
  leads: Route,
  sales: BookOpen,
  imports: Database,
  duplicates: ChevronRight,
  health: ShieldCheck
};

function NavigationIcon({ iconKey, active }: { iconKey: NavigationIconKey; active: boolean }) {
  const Icon = iconMap[iconKey];

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--cb-radius-md)] border border-transparent bg-[color:var(--cb-surface)] text-[color:var(--cb-muted-foreground)] transition",
        active && "border-[color:var(--cb-accent)]/20 bg-[color:var(--cb-accent)]/10 text-[color:var(--cb-accent)]"
      )}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4 stroke-[1.9]" aria-hidden={true} />
    </span>
  );
}

function navigationItemClass(active: boolean) {
  return cn(
    "group relative flex min-h-11 items-center gap-3 rounded-[var(--cb-radius-md)] border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]",
    active
      ? "border-[color:var(--cb-accent)]/25 bg-[color:var(--cb-accent)]/8 font-semibold text-[color:var(--cb-foreground)]"
      : "border-transparent bg-transparent font-medium text-[color:var(--cb-foreground)] hover:border-[color:var(--cb-border)] hover:bg-[color:var(--cb-surface)]"
  );
}

function NavigationLinks({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-4">
      {NAVIGATION_GROUPS.map((group) => (
        <section key={group.title} className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--cb-muted-foreground)]">
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
                  onClick={onNavigate}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-2.5 h-6 w-1 rounded-r-full bg-transparent transition",
                      active && "bg-[color:var(--cb-accent)]"
                    )}
                    aria-hidden="true"
                  />
                  <NavigationIcon iconKey={item.icon} active={active} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate", active ? "font-semibold" : "font-medium")}>
                      {item.label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function BrandMark() {
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-[var(--cb-radius-md)] bg-[color:var(--cb-accent)] text-sm font-semibold text-[color:var(--cb-accent-foreground)]"
      aria-hidden="true"
    >
      C
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[color:var(--cb-background)] text-[color:var(--cb-foreground)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] min-[1024px]:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] min-[1024px]:flex min-[1024px]:flex-col">
          <div className="border-b border-[color:var(--cb-border)] px-6 py-5">
            <Link href="/" prefetch={false} className="flex items-center gap-3 rounded-[var(--cb-radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]">
              <BrandMark />
              <span className="min-w-0">
                <span className="block text-[18px] font-semibold leading-none">ClarioBase</span>
                <span className="mt-1 block text-sm text-[color:var(--cb-muted-foreground)]">Creator workspace</span>
              </span>
            </Link>
          </div>
          <nav aria-label="Primary navigation" className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <NavigationLinks pathname={pathname} />
          </nav>
          <div className="border-t border-[color:var(--cb-border)] px-4 py-5">
            <div className="flex items-center gap-3 rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--cb-accent)]/12 text-sm font-semibold text-[color:var(--cb-accent)]" aria-hidden="true">
                ŁC
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Łukasz Chmiel</span>
                <span className="block text-xs uppercase tracking-[0.14em] text-[color:var(--cb-muted-foreground)]">Operator</span>
              </span>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)]/96 backdrop-blur min-[1024px]:hidden">
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <Link href="/" prefetch={false} className="flex items-center gap-3 rounded-[var(--cb-radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]">
                <BrandMark />
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-none">ClarioBase</span>
                  <span className="mt-1 block text-xs text-[color:var(--cb-muted-foreground)]">Creator workspace</span>
                </span>
              </Link>

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 text-sm font-semibold text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)]/20 hover:bg-[color:var(--cb-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]"
                  >
                    <Menu className="h-4 w-4" aria-hidden="true" />
                    Menu
                  </button>
                </SheetTrigger>
                <SheetContent
                  onEscapeKeyDown={() => setOpen(false)}
                  onPointerDownOutside={() => setOpen(false)}
                  className="w-[min(88vw,320px)]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[color:var(--cb-border)] px-4 py-4">
                    <div>
                      <SheetTitle className="text-base font-semibold">ClarioBase</SheetTitle>
                      <SheetDescription className="mt-1 text-sm text-[color:var(--cb-muted-foreground)]">
                        Creator workspace
                      </SheetDescription>
                    </div>
                    <SheetClose aria-label="Close navigation" className="inline-flex h-10 items-center gap-2 rounded-[var(--cb-radius-md)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 text-sm font-semibold text-[color:var(--cb-foreground)] transition hover:border-[color:var(--cb-accent)]/20 hover:bg-[color:var(--cb-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]">
                      Close
                    </SheetClose>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                    <nav aria-label="Primary navigation" className="space-y-5">
                      <NavigationLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                    </nav>
                  </div>
                  <div className="border-t border-[color:var(--cb-border)] px-4 py-4">
                    <div className="flex items-center gap-3 rounded-[var(--cb-radius-lg)] border border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] px-3 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--cb-accent)]/12 text-sm font-semibold text-[color:var(--cb-accent)]" aria-hidden="true">
                        ŁC
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">Łukasz Chmiel</span>
                        <span className="block text-xs uppercase tracking-[0.14em] text-[color:var(--cb-muted-foreground)]">Operator</span>
                      </span>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>

          <main className="min-w-0 w-full px-4 py-5 min-[768px]:px-6 min-[1024px]:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

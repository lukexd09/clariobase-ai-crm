import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">ClarioBase AI CRM</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Technical skeleton is ready.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Next.js App Router, TypeScript, Tailwind CSS, Prisma, Zod, and pnpm are wired for the CRM
            foundation.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/leads"
              className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Open leads
            </Link>
            <Link
              href="/work"
              className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200"
            >
              Open workbench
            </Link>
            <Link
              href="/imports"
              className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200"
            >
              Review imports
            </Link>
            <Link
              href="/duplicates"
              className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200"
            >
              Review duplicates
            </Link>
            <Link
              href="/health"
              className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200"
            >
              Health check
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

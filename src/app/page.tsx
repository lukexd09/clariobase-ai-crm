export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            ClarioBase AI CRM
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Technical skeleton is ready.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Next.js App Router, TypeScript, Tailwind CSS, Prisma, Zod, and pnpm
            are wired for the CRM foundation.
          </p>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-[clamp(16px,2vw,32px)] py-16 text-[#0F172A]">
      <div className="mx-auto max-w-xl rounded-xl border border-[#CBD5E1] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#475569]">Not found</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page is unavailable</h1>
        <p className="mt-3 text-base text-[#475569]">
          The requested ClarioBase route could not be found.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#006194] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006194] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

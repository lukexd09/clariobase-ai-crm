import Link from "next/link";
import { prototypeImports } from "@/lib/ux-prototype";

export default function ImportBatchesPage() {
  return <div className="space-y-3">{prototypeImports.map((batch) => <Link key={batch.id} href={`/ux-prototype/import-batches/${batch.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{batch.label}</Link>)}</div>;
}


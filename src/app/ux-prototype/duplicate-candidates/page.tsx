import Link from "next/link";
import { prototypeDuplicates } from "@/lib/ux-prototype";

export default function DuplicateCandidatesPage() {
  return <div className="space-y-3">{prototypeDuplicates.map((item) => <Link key={item.id} href={`/ux-prototype/duplicate-candidates/${item.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{item.left} vs {item.right}</Link>)}</div>;
}


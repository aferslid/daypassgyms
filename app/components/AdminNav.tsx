import Link from "next/link";

export default function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-3">
      <Link
        href="/admin/suggestions"
        className="rounded-lg border bg-white px-4 py-2 text-sm font-bold hover:bg-[#F2F2F0]"
      >
        Suggestions
      </Link>

      <Link
        href="/admin/reports"
        className="rounded-lg border bg-white px-4 py-2 text-sm font-bold hover:bg-[#F2F2F0]"
      >
        Reports
      </Link>

      <Link
        href="/admin/clicks"
        className="rounded-lg border bg-white px-4 py-2 text-sm font-bold hover:bg-[#F2F2F0]"
      >
        Clicks
      </Link>
    </nav>
  );
}
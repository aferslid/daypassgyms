import Link from "next/link";

export default function Header() {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#C8F135] text-lg">
          🏋️
        </span>
        <span className="text-sm font-bold text-white tracking-[-0.3px]">
          DayPassGyms
        </span>
      </Link>

      <div className="hidden items-center gap-6 text-[13px] text-[#999] md:flex">
        <Link href="/gyms" className="transition hover:text-white">
          Gym day passes
        </Link>

        <Link href="/map" className="transition hover:text-white">
          Map
        </Link>

        <Link href="/#how" className="transition hover:text-white">
          How it works
        </Link>

        <Link href="/blog" className="transition hover:text-white">
          Blog
        </Link>

        <Link href="/for-gym-owners" className="transition hover:text-white">
          For gym owners
        </Link>

        <Link href="/partnerships" className="transition hover:text-white">
          Partnerships
        </Link>

        <Link href="/about" className="transition hover:text-white">
          About
        </Link>
      </div>

      <Link
        href="/gyms"
        className="rounded-[8px] bg-[#C8F135] px-4 py-2 text-[13px] font-bold text-[#0C0C0C] transition hover:opacity-90"
      >
        Browse gyms
      </Link>
    </nav>
  );
}
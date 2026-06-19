import Link from "next/link";

export default function Header() {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#C8F135] text-lg">
          🏋️
        </span>
        <span className="text-sm font-bold text-white tracking-[-0.3px]">
          Gym Day Pass Map
        </span>
      </Link>

      <div className="hidden items-center gap-6 text-[13px] text-[#666] md:flex">
        <Link href="/gyms" className="transition hover:text-white">
          Explore
        </Link>
        <Link href="/map" className="transition hover:text-white">
          Map
        </Link>
        <link href="/#how" className="transition hover:text-white">
          How it works
        </link>
        <Link href="/suggest" className="transition hover:text-white">
          Suggest a gym
        </Link>
        <Link href="/for-gym-owners">
          For gym owners
        </Link>
        <Link href="/about">
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
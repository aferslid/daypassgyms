import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#EAEAEA] bg-[#F7F7F5]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#C8F135] text-lg">
                🏋️
              </span>

              <span className="text-[15px] font-bold tracking-[-0.3px] text-[#111]">
                Gym Day Pass Map
              </span>
            </div>

            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-[#777]">
              Find gyms with day passes while traveling. Compare prices,
              check showers and train anywhere.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-bold text-[#111]">
              Explore
            </h3>

            <div className="space-y-3 text-[13px] text-[#777]">
              <Link href="/gyms" className="block hover:text-black">
                Countries
              </Link>

              <Link href="/map" className="block hover:text-black">
                Map
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-bold text-[#111]">
              Resources
            </h3>

            <div className="space-y-3 text-[13px] text-[#777]">
              <Link href="/" className="block hover:text-black">
                Home
                </Link>

                <Link href="/gyms" className="block hover:text-black">
                Directory
                </Link>

                <Link href="/about" className="block hover:text-black">
                About
                </Link>

                <Link href="/for-gym-owners" className="block hover:text-black">
                For gym owners
                </Link>

                <Link href="/suggest" className="block hover:text-black">
                Suggest a gym
</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-bold text-[#111]">
              For gyms
            </h3>

            <div className="space-y-3 text-[13px] text-[#777]">
              <Link href="/for-gym-owners" className="block hover:text-black">
                List your gym
                </Link>

                <a
                href="mailto:aferslid@gmail.com"
                className="block hover:text-black"
                >
                Contact
                </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-[#EAEAEA] pt-8">
          <div className="flex flex-col gap-3 text-[12px] text-[#999] md:flex-row md:items-center md:justify-between">
            <div>
              © 2026 Gym Day Pass Map. Train anywhere.
            </div>

            <div className="flex gap-6">
              <div>Day Pass Gyms</div>
              <div>Travel Fitness</div>
              <div>Digital Nomads</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
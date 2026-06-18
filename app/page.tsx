import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "@/app/components/Footer";

export default async function Home() {
  const { count: totalGyms } = await supabase
    .from("spots")
    .select("*", { count: "exact", head: true })
    .ilike("type", "%gym%");

  const { data: countriesData } = await supabase
    .from("spots")
    .select("country")
    .ilike("type", "%gym%")
    .not("country", "is", null);

  const countriesCount = new Set(
    (countriesData || []).map((row) => row.country)
  ).size;

  return (
    <>
    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">
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
              <a href="#how" className="transition hover:text-white">
                How it works
              </a>
            </div>

            <Link
              href="/gyms"
              className="rounded-[8px] bg-[#C8F135] px-4 py-2 text-[13px] font-bold text-[#0C0C0C] transition hover:opacity-90"
            >
              Browse gyms
            </Link>
          </nav>

          <div className="pb-20 pt-16">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Global gym day-pass directory
            </p>

            <h1 className="max-w-3xl text-[58px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[82px]">
              Train<br />
              <span className="text-[#C8F135]">anywhere.</span>
            </h1>

            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
              Find gyms with day passes while traveling. Browse by country,
              compare prices, check showers and train on your terms.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/gyms"
                className="rounded-[8px] bg-[#C8F135] px-5 py-2.5 text-[13px] font-bold text-[#0C0C0C] transition hover:opacity-90"
              >
                Browse countries
              </Link>

              <Link
                href="/map"
                className="rounded-[8px] border border-[#2a2a2a] px-5 py-2.5 text-[13px] font-semibold text-[#888] transition hover:border-[#444] hover:text-white"
              >
                Open map →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] bg-[#111]">
          <div className="mx-auto max-w-7xl divide-x divide-[#1e1e1e] px-0 md:flex">
            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {totalGyms || 0}+
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                gyms listed
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {countriesCount}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                countries
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                Day pass
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                price focused
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                Free
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                to browse
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            How it works
          </p>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            Built for travelers who train.
          </h2>
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {[
            ["Browse by country", "Find countries and cities with listed day-pass gyms."],
            ["Check the essentials", "See day-pass price, shower info and location."],
            ["Open the map", "Use the map when you need a gym close to you."],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-[14px] border border-[#EBEBEB] bg-white p-5"
            >
              <h3 className="text-[16px] font-extrabold tracking-[-0.4px] text-[#111]">
                {title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#777]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
    </>
  );
}
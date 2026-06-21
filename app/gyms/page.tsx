import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import Footer from "@/app/components/Footer";
import Header from "../components/Header";
import CountrySearch from "@/app/components/CountrySearch";

// Add to your globals.css or layout:
// @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&display=swap');

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

function getCountryName(code: string) {
  const country = countriesList.find(
    (c) => c.cca2.toUpperCase() === code.toUpperCase()
  );
  return country?.name.common || code;
}

function getFlagUrl(code: string) {
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

export default async function GymsPage() {
  const { data } = await supabase
    .from("spots")
    .select("country")
    .ilike("type", "%gym%")
    .not("country", "is", null);

  const countryCounts = new Map<string, number>();
  (data || []).forEach((spot) => {
    const code = String(spot.country).toUpperCase();
    countryCounts.set(code, (countryCounts.get(code) || 0) + 1);
  });

  const countries = Array.from(countryCounts.entries())
    .map(([code, count]) => ({
      code,
      count,
      name: getCountryName(code),
      slug: slugify(getCountryName(code)),
      flag: getFlagUrl(code),
    }))
    .sort((a, b) => b.count - a.count);

  const totalGyms = countries.reduce((sum, c) => sum + c.count, 0);

  console.log("data =", data);
  console.log("count =", data?.length);

  return (
    <>
    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        {/* Soft lime glow blobs */}
        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">

          {/* Nav */}
          <Header />

          {/* Hero copy */}
          <div className="pb-16 pt-14">
            <p
              className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#C8F135]"
            >
              Global gym day-pass directory
            </p>

            <h1
              className="max-w-2xl text-[58px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[72px]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Train<br />
              <span className="text-[#C8F135]">anywhere.</span>
            </h1>

            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
              Day-pass gyms for travelers. Browse by country, compare prices,
              check showers — train on your terms.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#countries"
                className="rounded-[8px] bg-[#C8F135] px-5 py-2.5 text-[13px] font-bold text-[#0C0C0C] transition hover:opacity-90"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Browse countries
              </Link>
              <Link
                href="/map"
                className="rounded-[8px] border border-[#2a2a2a] px-5 py-2.5 text-[13px] font-semibold text-[#888] transition hover:border-[#444] hover:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Open map →
              </Link>
            </div>
          </div>
        </div>

        {/* Stats ticker */}
        <div className="border-t border-[#1e1e1e] bg-[#111]">
          <div className="mx-auto max-w-7xl divide-x divide-[#1e1e1e] px-0 md:flex">
            {[
              { num: `${totalGyms}+`, accent: true, label: "gyms listed" },
              { num: `${countries.length}`, accent: false, label: "countries" },
              { num: "Day pass", accent: true, label: "price focused" },
              { num: "Free", accent: false, label: "to browse" },
            ].map(({ num, accent, label }) => (
              <div key={label} className="flex-1 px-6 py-4">
                <div
                  className={`text-[26px] font-extrabold leading-none tracking-[-1px] ${accent ? "text-[#C8F135]" : "text-white"}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {num}
                </div>
                <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIRECTORY ── */}
      <section id="countries" className="mx-auto max-w-7xl px-6 py-16">

        {/* Section header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Directory
            </p>
            <h2
              className="mt-1 text-[22px] font-extrabold text-[#0C0C0C] tracking-[-0.5px]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              All countries
            </h2>
            <p className="mt-1 text-[13px] text-[#999]">
              Browse every country currently listed
            </p>
          </div>

          <CountrySearch />
        </div>

        {/* Country grid */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
        >
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/gyms/${country.slug}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 transition duration-150 hover:-translate-y-0.5 hover:border-[#C8F135]"
            >
              {/* Left accent bar — shows on hover */}
              <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C8F135] opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Flag */}
              <img
                src={country.flag}
                alt={`${country.name} flag`}
                className="h-[22px] w-8 flex-shrink-0 rounded-[3px] object-cover"
              />

              {/* Name + count */}
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[13px] font-bold text-[#111] tracking-[-0.2px]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {country.name}
                </div>
                <div className="text-[11px] text-[#999]">
                  {country.count} gym{country.count > 1 ? "s" : ""}
                </div>
              </div>

              {/* Arrow */}
              <span className="flex-shrink-0 text-[#ccc] transition-all group-hover:translate-x-0.5 group-hover:text-[#C8F135]">
                →
              </span>

              {/* Ghost count */}
              <span
                className="pointer-events-none absolute -bottom-2 right-0 text-[44px] font-extrabold leading-none tracking-[-2px] text-[#F0F0EE] select-none"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                aria-hidden="true"
              >
                {country.count}
              </span>
            </Link>
          ))}
        </div>
        
      </section>
    </main>
    <Footer />
</>
  );
}
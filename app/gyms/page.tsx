export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import Footer from "@/app/components/Footer";
import Header from "../components/Header";
import CountrySearch from "@/app/components/CountrySearch";
import CountriesGrid from "../components/CountriesGrid";

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

function normalizeCountryName(code: string, name: string) {
  const specialCases: Record<string, string> = {
    TR: "Turkey",
    SX: "Sint Maarten",
    MF: "Saint Martin",
  };

  return specialCases[code.toUpperCase()] || name;
}

export default async function GymsPage() {
  const { data } = await supabase
    .from("spots")
    .select("country, city")
    .ilike("type", "%gym%")
    .not("country", "is", null);

  console.log("count =", data?.length);
  console.log("Rows:", data?.length);
  console.log(data?.slice(-10));

  const countryCounts = new Map<string, number>();
  (data || []).forEach((spot) => {
    const code = String(spot.country).toUpperCase();
    countryCounts.set(code, (countryCounts.get(code) || 0) + 1);
  });

  const countries = Array.from(countryCounts.entries())
  .map(([code, count]) => {
    const name = normalizeCountryName(code, getCountryName(code));

    return {
      code,
      count,
      name,
      slug: slugify(name),
      flag: getFlagUrl(code),
    };
  })
  .sort((a, b) => b.count - a.count);

  const totalGyms = countries.reduce((sum, c) => sum + c.count, 0);

  const citiesCount = new Set(
    (data || [])
      .filter((spot) => spot.country && spot.city)
      .map((spot) => `${spot.country.toUpperCase()}-${spot.city}`)
  ).size;

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
              { num: `${citiesCount}`, accent: true, label: "cities" },
              { num: "Day pass", accent: false, label: "price focused" },
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

      <CountriesGrid countries={countries} />
        
      </section>
    </main>
    <Footer />
</>
  );
}
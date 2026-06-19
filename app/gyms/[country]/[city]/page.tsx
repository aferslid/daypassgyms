import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import Footer from "@/app/components/Footer";

type CityPageProps = {
  params: Promise<{
    country: string;
    city: string;
  }>;
};

type Gym = {
  id: number;
  name: string;
  description: string | null;
  country: string | null;
  city: string | null;
  photo_url: string | null;
  details: {
    day_pass_price?: number | null;
    currency?: string | null;
    shower?: boolean | null;
  } | null;
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCountryCodeFromSlug(slug: string) {
  const formatted = formatSlug(slug);

  const country = countriesList.find(
    (c) => slugify(c.name.common) === slug || c.name.common === formatted
  );

  return country?.cca2.toUpperCase() || null;
}

function formatPrice(details: Gym["details"]) {
  if (!details?.day_pass_price) return "Price unknown";

  return `${new Intl.NumberFormat().format(details.day_pass_price)} ${
    details.currency || ""
  }`;
}

function formatShower(details: Gym["details"]) {
  if (details?.shower === true) return "🚿 Shower";
  if (details?.shower === false) return "No shower info";
  return "Shower unknown";
}

export async function generateMetadata({ params }: CityPageProps) {
  const { country, city } = await params;
  const countryName = formatSlug(country);
  const cityName = formatSlug(city);

  return {
    title: `Gyms with Day Passes in ${cityName}, ${countryName}`,
    description: `Find gyms with day passes in ${cityName}, ${countryName}. Browse day pass prices, shower info and locations.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { country, city } = await params;

  const countryName = formatSlug(country);
  const cityName = formatSlug(city);
  const countryCode = getCountryCodeFromSlug(country);

  const { data: allGyms, error } = await supabase
    .from("spots")
    .select("id, name, description, country, city, photo_url, details")
    .eq("country", countryCode)
    .ilike("type", "%gym%")
    .order("name");

  const gyms = (allGyms || []).filter(
    (gym) => slugify(gym.city || "") === city
  );

  if (error) {
    console.error(error);
  }

  return (
    <>
    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">
          <nav className="flex items-center justify-between">
            <Link href="/gyms" className="flex items-center gap-3">
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
              <a href="#gyms" className="transition hover:text-white">
                Gyms
              </a>
            </div>

            <Link
              href={`/gyms/${country}`}
              className="rounded-[8px] bg-[#C8F135] px-4 py-2 text-[13px] font-bold text-[#0C0C0C] transition hover:opacity-90"
            >
              Back to {countryName}
            </Link>
          </nav>

          <div className="pb-16 pt-14">
            <Link
              href={`/gyms/${country}`}
              className="mb-5 inline-block text-[13px] font-medium text-[#777] hover:text-white"
            >
              ← Back to {countryName}
            </Link>

            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              City directory
            </p>

            <h1 className="max-w-3xl text-[56px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[72px]">
              Gyms in<br />
              <span className="text-[#C8F135]">{cityName}.</span>
            </h1>

            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
              Browse gyms with day passes in {cityName}, {countryName}. Compare
              prices, check shower info and find where to train.
            </p>
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] bg-[#111]">
          <div className="mx-auto max-w-7xl divide-x divide-[#1e1e1e] px-0 md:flex">
            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {(gyms || []).length}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                gyms listed
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {countryName}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                country
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

      <section id="gyms" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Gyms
          </p>

          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            All gyms in {cityName}
          </h2>

          <p className="mt-1 text-[13px] text-[#999]">
            {cityName} currently has {(gyms || []).length} listed gym
            {(gyms || []).length > 1 ? "s" : ""} with day-pass information.
          </p>
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {(gyms || []).map((gym: Gym) => (
            <Link
              key={gym.id}
              href={`/gym/${slugify(gym.name)}-${gym.id}`}
              className="group relative overflow-hidden rounded-[14px] border border-[#EBEBEB] bg-white p-4 transition duration-150 hover:-translate-y-0.5 hover:border-[#C8F135]"
            >
              <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C8F135] opacity-0 transition-opacity group-hover:opacity-100" />

              <h3 className="pr-10 text-[16px] font-extrabold tracking-[-0.4px] text-[#111]">
                {gym.name}
              </h3>

              {gym.city && (
                <p className="mt-1 text-[12px] text-[#999]">📍 {gym.city}</p>
              )}

              {gym.description && (
                <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-[#777]">
                  {gym.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-[#F2F2F0] px-3 py-1 text-[#555]">
                  💰 {formatPrice(gym.details)}
                </span>

                <span className="rounded-full bg-[#F2F2F0] px-3 py-1 text-[#555]">
                  {formatShower(gym.details)}
                </span>
              </div>

              <div className="mt-5 text-[12px] font-bold text-[#0C0C0C] transition group-hover:text-[#C8F135]">
                View gym →
              </div>
            </Link>
          ))}
        </div>

        {(gyms || []).length === 0 && (
          <div className="rounded-[14px] border border-[#EBEBEB] bg-white p-6 text-[#555]">
            No gyms found yet for this city.
          </div>
        )}
      </section>
    </main>
    <Footer />
</>
  );
}
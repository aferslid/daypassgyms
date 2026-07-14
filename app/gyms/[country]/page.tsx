export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import Footer from "@/app/components/Footer";
import Header from "../../components/Header";
import Image from "next/image";
import { permanentRedirect, notFound } from "next/navigation";

type CountryPageProps = {
  params: Promise<{
    country: string;
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
    .replace(/ß/g, "ss")
    .replace(/ẞ/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCountryFromSlug(slug: string) {
  const normalizedSlug = slug.toLowerCase();

  const specialCases: Record<string, string> = {
    "sint-maarten": "SX",
    "saint-martin": "MF",
    turkey: "TR",
    turkiye: "TR",
  };

  const specialCode = specialCases[normalizedSlug];

  const country = countriesList.find((item) => {
    if (
      specialCode &&
      item.cca2.toUpperCase() === specialCode
    ) {
      return true;
    }

    return (
      slugify(item.name.common) === normalizedSlug ||
      item.cca2.toLowerCase() === normalizedSlug
    );
  });

  if (!country) {
    return null;
  }

  return {
    code: country.cca2.toUpperCase(),
    name: country.name.common,
    canonicalSlug: slugify(country.name.common),
  };
}

function formatCountry(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCountryCodeFromSlug(slug: string) {
  const specialCases: Record<string, string> = {
    "sint-maarten": "SX",
    "saint-martin": "MF",
    "turkey": "TR",
    "turkiye": "TR",
  };

  if (specialCases[slug]) return specialCases[slug];

  const formatted = formatCountry(slug);

  const country = countriesList.find(
    (c) => slugify(c.name.common) === slug || c.name.common === formatted
  );

  return country?.cca2.toUpperCase() || null;
}

function getCountryName(code: string | null) {
  if (!code) return "";

  const specialCases: Record<string, string> = {
    SX: "Sint Maarten",
    MF: "Saint Martin",
    TR: "Turkey",
  };

  if (specialCases[code.toUpperCase()]) {
    return specialCases[code.toUpperCase()];
  }

  const country = countriesList.find(
    (c) => c.cca2.toUpperCase() === code.toUpperCase()
  );

  return country?.name.common || code;
}

function formatPrice(details: Gym["details"]) {
  if (!details?.day_pass_price) return "Price unknown";

  // Si c'est un nombre
  if (!isNaN(Number(details.day_pass_price))) {
    return `${new Intl.NumberFormat().format(Number(details.day_pass_price))} ${
      details.currency || ""
    }`;
  }

  // Si c'est du texte ("One-time free trial", "1-day free", etc.)
  return details.day_pass_price;
}

function formatShower(details: Gym["details"]) {
  if (details?.shower === true) return "🚿 Shower";
  if (details?.shower === false) return "No shower info";
  return "Shower unknown";
}

export async function generateMetadata({
  params,
}: CountryPageProps) {
  const { country } = await params;

  const normalizedCountryCode = country.toLowerCase();

  const countryName =
    countriesList.find(
      (item) =>
        item.cca2.toLowerCase() === normalizedCountryCode
    )?.name.common ?? formatCountry(country);

  const title = `Day Pass Gyms in ${countryName} | DayPassGyms`;

  const description =
    `Find gyms offering day passes in ${countryName}. ` +
    `Compare prices, showers, lockers, Wi-Fi and locations.`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: `https://daypassgyms.com/gyms/${country}`,
      siteName: "DayPassGyms",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },

    alternates: {
      canonical: `https://daypassgyms.com/gyms/${country}`,
    },
  };
}

async function fetchAllCountryGyms(countryCode: string | null): Promise<Gym[]> {
  if (!countryCode) return [];

  const pageSize = 1000;
  let from = 0;
  let rows: Gym[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("spots")
      .select("id, name, description, country, city, photo_url, details")
      .eq("country", countryCode)
      .ilike("type", "gym")
      .order("name")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    rows.push(...((data || []) as Gym[]));

    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  return rows;
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { country } = await params;
  const resolvedCountry = resolveCountryFromSlug(country);

  if (!resolvedCountry) {
    notFound();
  }

  if (country.toLowerCase() !== resolvedCountry.canonicalSlug) {
    permanentRedirect(
      `/gyms/${resolvedCountry.canonicalSlug}`
    );
  }

  const countryCode = resolvedCountry.code;
  const countryName = resolvedCountry.name;

  const gyms = await fetchAllCountryGyms(countryCode);

  const cities = Object.entries(
    (gyms || []).reduce((acc, gym) => {
      if (!gym.city) return acc;

      acc[gym.city] = (acc[gym.city] || 0) + 1;

      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const priceRanges = Object.entries(
    (gyms || []).reduce((acc, gym) => {
      const price = Number(gym.details?.day_pass_price);
      const currency = gym.details?.currency || "Unknown";

      if (isNaN(price) || price <= 0) return acc;

      if (!acc[currency]) acc[currency] = [];
      acc[currency].push(price);

      return acc;
    }, {} as Record<string, number[]>)
  ).map(([currency, prices]) => ({
    currency,
    min: Math.min(...prices),
    max: Math.max(...prices),
  }));

  const priceRangeText =
    priceRanges.length > 0
      ? priceRanges
          .map((range) => {
            const min = new Intl.NumberFormat().format(range.min);
            const max = new Intl.NumberFormat().format(range.max);

            return range.min === range.max
              ? `${min} ${range.currency}`
              : `${min}-${max} ${range.currency}`;
          })
          .join(" · ")
      : "Unknown";

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Gyms with day passes in ${countryName}`,
    itemListElement: (gyms || []).map((gym, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: gym.name,
      url: `https://daypassgyms.com/gym/${slugify(gym.name)}-${gym.id}`,
    })),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(itemListStructuredData),
      }}
    />
    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="grid gap-12 pb-16 pt-14 lg:grid-cols-2 lg:items-center">
            <div>
            <Link
              href="/gyms"
              className="mb-5 inline-block text-[13px] font-medium text-[#777] hover:text-white"
            >
              ← Back to countries
            </Link>

            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Country directory
            </p>

            <h1 className="max-w-3xl text-[56px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[72px]">
              Gyms in<br />
              <span className="text-[#C8F135]">{countryName}.</span>
            </h1>

            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
              Browse gyms with day passes in {countryName}. Compare prices,
              check shower info and find where to train.
            </p>
            </div>
            <div className="hidden lg:flex justify-end">
              <div className="relative h-[360px] w-full max-w-[560px] overflow-hidden rounded-[24px] border border-[#222]">
                <Image
                  src={`/images/countries/${slugify(countryName)}.jpg`}
                  alt={countryName}
                  fill
                  className="object-cover transition duration-700 hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>
            </div>
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
                {cities.length}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                cities
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {priceRangeText}
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                price range
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                Day pass
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                price focused
              </div>
            </div>            
          </div>
        </div>
      </section>

      <section id="cities" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Cities
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            Cities in {countryName}
          </h2>
          <p className="mt-1 text-[13px] text-[#999]">
            Choose a city to browse gyms with day passes.
          </p>
        </div>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
        >
          {cities.map(([city, count]) => (
            <Link
              key={city}
              href={`/gyms/${slugify(countryName)}/${slugify(city)}`}
              className="group relative flex items-center justify-between overflow-hidden rounded-[10px] border border-[#EBEBEB] bg-white px-4 py-3 transition duration-150 hover:-translate-y-0.5 hover:border-[#C8F135]"
            >
              <span className="absolute inset-y-0 left-0 w-[3px] bg-[#C8F135] opacity-0 transition-opacity group-hover:opacity-100" />

              <div>
                <div className="text-[13px] font-bold tracking-[-0.2px] text-[#111]">
                  {city}
                </div>
                <div className="text-[11px] text-[#999]">
                  {count} gym{count > 1 ? "s" : ""}
                </div>
              </div>

              <span className="text-[#ccc] transition-all group-hover:translate-x-0.5 group-hover:text-[#C8F135]">
                →
              </span>

              <span
                className="pointer-events-none absolute -bottom-2 right-0 text-[44px] font-extrabold leading-none tracking-[-2px] text-[#F0F0EE] select-none"
                aria-hidden="true"
              >
                {count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Gyms
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            All gyms in {countryName}
          </h2>
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
            No gyms found yet for this country.
          </div>
        )}
      </section>
    </main>
    <Footer />
</>
  );
}
export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import Footer from "@/app/components/Footer";
import Header from "../../../components/Header";
import { notFound, permanentRedirect } from "next/navigation";
import TravelGuides from "@/app/components/TravelGuides";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { slugify } from "@/lib/slugify";
import {
  formatGymType,
  getGymTypeBadgeClass,
} from "@/lib/gymType";

type CityPageProps = {
  params: Promise<{
    country: string;
    city: string;
  }>;
};

type Gym = {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  photo_url: string | null;
  day_pass_price: number | null;
  currency: string | null;
  shower: boolean | null;
};

const CITY_SLUG_ALIASES: Record<string, Record<string, string>> = {
  IT: {
    roma: "rome",
    milano: "milan",
    napoli: "naples",
  },

  SE: {
    goteborg: "gothenburg",
    goeteborg: "gothenburg",
  },

  NO: {
    troms: "tromso",
    "mosj-en": "mosjoen",
    "kv-fjord": "kvaefjord",
    "b-rum": "baerum",
    "s-rreisa": "sorreisa",
    "sandnessj-en": "sandnessjoen",
  },

  CO: {
    bogot: "bogota",
    "medell-n": "medellin",
  },

  PL: {
    "krak-w": "krakow",
    "wa-brzych": "walbrzych",
    "g-ogow": "glogow",
    "p-ock": "plock",
  },

  ES: {
    "m-laga": "malaga",
  },

  FR: {
    chirolles: "echirolles",
  },

  GT: {
    "santiago-atitl-n": "santiago-atitlan",
  },

  EC: {
    "ba-os-de-agua-santa": "banos-de-agua-santa",
    "monta-ita": "montanita",
  },

  NI: {
    "le-n": "leon",
  },
};

function resolveCitySlug(countryCode: string, citySlug: string) {
  const normalizedCitySlug = citySlug
    .toLowerCase()
    .replace(/-3$/, "");

  return (
    CITY_SLUG_ALIASES[countryCode]?.[normalizedCitySlug] ||
    normalizedCitySlug
  );
}


function resolveCountryFromSlug(slug: string) {
  const normalizedSlug = slug.toLowerCase();

  const specialCases: Record<string, string> = {
    "sint-maarten": "SX",
    "saint-maarten": "SX",
    "saint-martin": "MF",

    turkey: "TR",
    turkiye: "TR",

    usa: "US",
    england: "GB",
    wales: "GB",
    "the-netherlands": "NL",
    "cote-d-ivoire": "CI",
    barhain: "BH",
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

function formatSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCountryCodeFromSlug(slug: string) {
  const specialCases: Record<string, string> = {
    "sint-maarten": "SX",
    "saint-maarten": "SX",
    "saint-martin": "MF",

    turkey: "TR",
    turkiye: "TR",

    usa: "US",
    england: "GB",
    wales: "GB",
    "the-netherlands": "NL",
    "cote-d-ivoire": "CI",
    barhain: "BH",
  };

  if (specialCases[slug]) return specialCases[slug];

  const formatted = formatSlug(slug);

  const country = countriesList.find(
    (c) => slugify(c.name.common) === slug || c.name.common === formatted
  );

  return country?.cca2.toUpperCase() || null;
}

function formatPrice(gym: Gym) {
  if (gym.day_pass_price === null || gym.day_pass_price === undefined) {
    return "Price unknown";
  }

  return `${new Intl.NumberFormat().format(gym.day_pass_price)} ${
    gym.currency || ""
  }`;
}

function formatShower(gym: Gym) {
  if (gym.shower === true) return "🚿 Shower";
  if (gym.shower === false) return "No shower";
  return "Shower unknown";
}

export async function generateMetadata({ params }: CityPageProps) {
  const { country, city } = await params;

  const resolvedCountry = resolveCountryFromSlug(country);

  if (!resolvedCountry) {
    return {
      title: "City not found",
    };
  }

  const countryName = resolvedCountry.name;

  const canonicalCitySlug = resolveCitySlug(
    resolvedCountry.code,
    city
  );

  const cityName = canonicalCitySlug
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

  const title =
    `Gym Day Passes in ${cityName}, ${countryName} | DayPassGyms`;

  const description =
    `Find gyms offering day passes in ${cityName}, ${countryName}. ` +
    `Compare prices, showers, lockers, Wi-Fi, facilities, and visitor access information.`;

  const canonicalUrl =
    `https://www.daypassgyms.com/gyms/${resolvedCountry.canonicalSlug}/${canonicalCitySlug}`;

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "DayPassGyms",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "DayPassGyms",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
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
      .select(
        "id, name, type, description, country, city, photo_url, day_pass_price, currency, shower"
      )
      .eq("country", countryCode)
      .order("name")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    rows.push(...((data || []) as Gym[]));

    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  return rows;
}

export default async function CityPage({ params }: CityPageProps) {
  const { country, city } = await params;

  const resolvedCountry = resolveCountryFromSlug(country);

  if (!resolvedCountry) {
    notFound();
  }

  const canonicalCitySlug = resolveCitySlug(
    resolvedCountry.code,
    city
  );

  if (city.toLowerCase() !== canonicalCitySlug) {
    permanentRedirect(
      `/gyms/${resolvedCountry.canonicalSlug}/${canonicalCitySlug}`
    );
  }

  if (
    country.toLowerCase() !==
    resolvedCountry.canonicalSlug
  ) {
    permanentRedirect(
      `/gyms/${resolvedCountry.canonicalSlug}/${city}`
    );
  }

  const countryCode = resolvedCountry.code;
  const countryName = resolvedCountry.name;

  const cityName = formatSlug(city);

  const allGyms = await fetchAllCountryGyms(countryCode);

  const gyms = allGyms.filter(
    (gym) => slugify(gym.city || "") === city
  );

  if (!gyms || gyms.length === 0) {
      notFound();
    }

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Gyms with day passes in ${cityName}, ${countryName}`,
    itemListElement: gyms.map((gym, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: gym.name,
      url: `https://www.daypassgyms.com/gym/${slugify(gym.name)}-${gym.id}`,
    })),
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Can I get a day pass gym in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. DayPassGyms currently lists ${gyms.length} ${
            gyms.length === 1 ? "gym" : "gyms"
          } in ${cityName} with day-pass information.`,
        },
      },
      {
        "@type": "Question",
        name: `How much does a gym day pass cost in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Prices vary depending on the gym. Browse the listed gyms in ${cityName} to compare day pass prices.`,
        },
      },
      {
        "@type": "Question",
        name: `Do gyms in ${cityName} have showers?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Some gyms provide showers and some do not. Shower information is shown when available.`,
        },
      },
    ],
  };

  const priceRanges = Object.entries(
  (gyms || []).reduce((acc, gym) => {
    const price = Number(gym.day_pass_price);
    const currency = gym.currency || "Unknown";

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
        .join(" • ")
    : "Unknown";

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(itemListStructuredData),
      }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqStructuredData),
      }}
    />
    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="pb-16 pt-14">
            <Breadcrumbs
              light
              items={[
                {
                  label: "Home",
                  href: "/",
                },
                {
                  label: "Gyms",
                  href: "/gyms",
                },
                {
                  label: countryName,
                  href: `/gyms/${resolvedCountry.canonicalSlug}`,
                },
                {
                  label: cityName,
                  href: `/gyms/${resolvedCountry.canonicalSlug}/${city}`,
                },
              ]}
            />

            <p className="mb-4 mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              City directory
            </p>

            <h1 className="max-w-3xl text-[56px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[72px]">
              Gym day passes in<br />
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
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                gyms listed
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {countryName}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                country
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {priceRangeText}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                price range
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                Day pass
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                price focused
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="gyms" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6">
          <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Gyms
          </p>

          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            Gyms with day passes in {cityName}
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

              {gym.type && (
                <span
                  className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${getGymTypeBadgeClass(gym.type)}`}
                >
                  {formatGymType(gym.type)}
                </span>
              )}

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
                  💰 {formatPrice(gym)}
                </span>

                <span className="rounded-full bg-[#F2F2F0] px-3 py-1 text-[#555]">
                  {formatShower(gym)}
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

    

                        <section className="border-t border-[#E4E4E1] bg-[#F7F7F5]">
                          <div className="mx-auto max-w-7xl px-6 py-16">
                            <div className="overflow-hidden rounded-[24px] border border-[#E4E4E1] bg-white">
                              <div className="grid md:grid-cols-[1.5fr_0.7fr]">

                                <div className="p-8 md:p-12">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8BAA00]">
                                    TRAINING IN {cityName.toUpperCase()}
                                  </p>

                                  <h2 className="mt-3 max-w-xl text-[32px] font-extrabold leading-[1] tracking-[-1px] text-[#0C0C0C] md:text-[42px]">
                                    Finding a gym day pass in {cityName}
                                  </h2>

                                  <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-[#666]">
                                    <p>
                                      DayPassGyms currently lists{" "}
                                      <strong className="text-[#0C0C0C]">
                                        {gyms.length} {gyms.length === 1 ? "gym" : "gyms"}
                                      </strong>{" "}
                                      in {cityName}, {countryName} with day-pass information.
                                    </p>

                                    <p>
                                      If you&apos;re visiting {cityName}, a day pass lets you train
                                      without committing to a long-term membership. Compare prices
                                      and facilities above before choosing where to work out.
                                    </p>
                                  </div>

                                  <Link
                                    href={`/gyms/${resolvedCountry.canonicalSlug}`}
                                    className="mt-7 inline-flex items-center text-[14px] font-bold text-[#0C0C0C] transition hover:text-[#8BAA00]"
                                  >
                                    Browse all gym day passes in {countryName} →
                                  </Link>
                                </div>

                                <div className="flex flex-col justify-center bg-[#0C0C0C] p-8 md:p-10">
                                  <div className="border-b border-[#242424] pb-6">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                                      Gyms listed
                                    </div>

                                    <div className="mt-2 text-[38px] font-extrabold tracking-[-1.5px] text-[#C8F135]">
                                      {gyms.length}
                                    </div>
                                  </div>

                                  <div className="border-b border-[#242424] py-6">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                                      Day-pass prices
                                    </div>

                                    <div className="mt-2 text-[22px] font-extrabold tracking-[-0.5px] text-white">
                                      {priceRangeText}
                                    </div>
                                  </div>

                                  <div className="pt-6">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                                      Location
                                    </div>

                                    <div className="mt-2 text-[18px] font-bold text-white">
                                      {cityName}, {countryName}
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </section>

        <TravelGuides
          title={`Training in ${cityName}?`}
          description={`Before visiting a gym in ${cityName}, learn how gym day passes work, what to bring and how to compare gyms while travelling.`}
          limit={2}
        />
    </main>
    <Footer />
</>
  );
}
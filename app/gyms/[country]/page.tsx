export const revalidate = 86400;
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import Footer from "@/app/components/Footer";
import Header from "../../components/Header";
import Image from "next/image";
import { permanentRedirect, notFound } from "next/navigation";
import CitiesGrid from "@/app/components/CitiesGrid";
import TravelGuides from "@/app/components/TravelGuides";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { slugify } from "@/lib/slugify";
import {
  formatGymType,
  getGymTypeBadgeClass,
} from "@/lib/gymType";

type CountryPageProps = {
  params: Promise<{
    country: string;
  }>;
};

type Gym = {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  state_code: string | null;
  photo_url: string | null;
  day_pass_price: number | null;
  currency: string | null;
  shower: boolean | null;
};

const REGION_NAMES: Record<string, Record<string, string>> = {
  US: {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
  },

  CA: {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon",
  },
};

const CANADA_REGION_FLAG_FILES: Record<string, string> = {
  AB: "Flag_of_Alberta.svg",
  BC: "Flag_of_British_Columbia.svg",
  MB: "Flag_of_Manitoba.svg",
  NB: "Flag_of_New_Brunswick.svg",
  NL: "Flag_of_Newfoundland_and_Labrador.svg",
  NS: "Flag_of_Nova_Scotia.svg",
  NT: "Flag_of_the_Northwest_Territories.svg",
  NU: "Flag_of_Nunavut.svg",
  ON: "Flag_of_Ontario.svg",
  PE: "Flag_of_Prince_Edward_Island.svg",
  QC: "Flag_of_Quebec.svg",
  SK: "Flag_of_Saskatchewan.svg",
  YT: "Flag_of_Yukon.svg",
};

function getRegionFlagUrl(
  countryCode: string,
  regionCode: string
) {
  if (countryCode === "US") {
    return `https://flagcdn.com/24x18/us-${regionCode.toLowerCase()}.png`;
  }

  if (countryCode === "CA") {
    const filename =
      CANADA_REGION_FLAG_FILES[regionCode];

    if (!filename) return null;

    return (
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/" +
      encodeURIComponent(filename)
    );
  }

  return null;
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

export async function generateMetadata({
  params,
}: CountryPageProps) {
  const { country } = await params;

  const resolvedCountry = resolveCountryFromSlug(country);

  if (!resolvedCountry) {
    return {
      title: "Country not found",
    };
  }

  const countryName = resolvedCountry.name;

  const title = `Gym Day Passes in ${countryName}`;
  const socialTitle = `${title} | DayPassGyms`;

  const description =
    `Find gyms offering day passes in ${countryName}. ` +
    `Compare prices, showers, lockers, Wi-Fi and visitor access before you train.`;

  const canonicalUrl =
    `https://www.daypassgyms.com/gyms/${resolvedCountry.canonicalSlug}`;

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: socialTitle,
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
      title: socialTitle,
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
        "id, name, type, description, country, city, state_code, photo_url, day_pass_price, currency, shower"
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

  const supportsRegions =
  countryCode === "US" || countryCode === "CA";

const regions = supportsRegions
  ? Object.entries(
      gyms.reduce((acc, gym) => {
        if (!gym.state_code) return acc;

        const code = gym.state_code.toUpperCase();

        if (!REGION_NAMES[countryCode]?.[code]) {
          return acc;
        }

        acc[code] = (acc[code] || 0) + 1;

        return acc;
      }, {} as Record<string, number>)
    )
      .map(([code, count]) => ({
        code,
        name: REGION_NAMES[countryCode][code],
        count,
      }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.name.localeCompare(b.name)
      )
  : [];

  const displayedGyms =
  gyms.length <= 18
    ? gyms
    : cities
        .slice(0, 12)
        .map(([city]) => gyms.find((gym) => gym.city === city))
        .filter((gym): gym is Gym => Boolean(gym));

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
      url: `https://www.daypassgyms.com/gym/${slugify(gym.name)}-${gym.id}`,
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
              ]}
            />

            <p className="mb-4 mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Country directory
            </p>

            <h1 className="max-w-3xl text-[56px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[72px]">
              Gym day passes in<br />
              <span className="text-[#C8F135]">{countryName}.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-[#777]">
              Find gyms with day passes in {countryName}. Compare single-visit
              prices, facilities and visitor access, and find a gym without a
              membership.
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
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                gyms listed
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {cities.length}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                cities
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

      {regions.length > 0 && (
        <section
          id="regions"
          className="mx-auto max-w-7xl px-6 pt-14"
        >
          <div className="mb-7">
            <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              {countryCode === "US" ? "States" : "Provinces"}
            </p>

            <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.7px] text-[#0C0C0C]">
              {countryCode === "US"
                ? `States in ${countryName}`
                : `Provinces in ${countryName}`}
            </h2>

            <p className="mt-2 text-[13px] text-[#999]">
              Browse gym day passes by{" "}
              {countryCode === "US" ? "state" : "province"}.
            </p>
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {regions.map((region) => (
              <Link
                key={region.code}
                href={`/gyms/${
                  resolvedCountry.canonicalSlug
                }/region/${slugify(region.name)}`}
                className="group relative h-[62px] overflow-hidden rounded-[10px] border border-[#E2E2DE] bg-white px-4 py-3 transition hover:border-[#C8F135]"
              >
                {/* BIG NUMBER BACKGROUND */}
                <span className="pointer-events-none absolute -bottom-[10px] right-1 text-[46px] font-extrabold leading-none tracking-[-3px] text-[#EEEEEA]">
                  {region.count}
                </span>

                {/* NAME + FLAG */}
                <div className="relative z-10 flex items-center gap-2 pr-8">

                  {getRegionFlagUrl(countryCode, region.code) && (
                    <img
                      src={getRegionFlagUrl(countryCode, region.code)!}
                      width="24"
                      height="18"
                      alt={`${region.name} flag`}
                      className="h-[18px] w-[24px] shrink-0 rounded-[2px] object-cover"
                      loading="lazy"
                    />
                  )}

                  <span className="truncate text-[13px] font-extrabold text-[#111]">
                    {region.name}
                  </span>

                </div>

                {/* SMALL COUNT */}
                <div className="relative z-10 mt-1 text-[11px] text-[#999]">
                  {region.count}{" "}
                  {region.count === 1 ? "gym" : "gyms"}
                </div>

                {/* ARROW */}
                <span className="absolute right-4 top-[18px] z-10 text-[15px] text-[#AAA] transition group-hover:translate-x-1 group-hover:text-[#789000]">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="cities" className="mx-auto max-w-7xl px-6 py-14">
        
        <CitiesGrid
          cities={cities}
          countryName={countryName}
          countrySlug={resolvedCountry.canonicalSlug}
        />
        
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6">
          <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Gyms
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            {gyms.length <= 18
              ? `Gyms with day passes in ${countryName}`
              : `Explore gyms in ${countryName}`}
          </h2>

          {gyms.length > 18 && (
            <p className="mt-2 text-[13px] text-[#999]">
              Showing gyms across popular cities. Choose a city above to explore all{" "}
              {gyms.length} listed gyms in {countryName}.
            </p>
          )}
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {displayedGyms.map((gym: Gym) => (
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
            No gyms found yet for this country.
          </div>
        )}
      </section>

            <section className="border-t border-[#E4E4E1] bg-[#F7F7F5]">
                <div className="mx-auto max-w-7xl px-6 py-16">
                  <div className="overflow-hidden rounded-[24px] border border-[#E4E4E1] bg-white">
                    <div className="grid md:grid-cols-[1.5fr_0.7fr]">

                      <div className="p-8 md:p-12">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8BAA00]">
                          TRAINING IN {countryName.toUpperCase()}
                        </p>

                        <h2 className="mt-3 max-w-xl text-[32px] font-extrabold leading-[1] tracking-[-1px] text-[#0C0C0C] md:text-[42px]">
                          Finding a gym day pass in {countryName}
                        </h2>

                        <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-[#666]">
                          <p>
                            DayPassGyms currently lists{" "}
                            <strong className="text-[#0C0C0C]">
                              {gyms.length} {gyms.length === 1 ? "gym" : "gyms"}
                            </strong>{" "}
                            across{" "}
                            <strong className="text-[#0C0C0C]">
                              {cities.length} {cities.length === 1 ? "city" : "cities"}
                            </strong>{" "}
                            in {countryName} with day-pass information.
                          </p>

                          <p>
                            If you&apos;re traveling in {countryName}, a gym day pass
                            lets you train without committing to a long-term membership.
                            Browse the city directories and gym listings above to compare
                            prices and facilities before choosing where to work out.
                          </p>
                        </div>

                        <Link
                          href="/gyms"
                          className="mt-7 inline-flex items-center text-[14px] font-bold text-[#0C0C0C] transition hover:text-[#8BAA00]"
                        >
                          Browse gym day passes worldwide →
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
                            Cities covered
                          </div>

                          <div className="mt-2 text-[38px] font-extrabold tracking-[-1.5px] text-white">
                            {cities.length}
                          </div>
                        </div>

                        <div className="border-b border-[#242424] py-6">
                          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                            Day-pass prices
                          </div>

                          <div className="mt-2 text-[22px] font-extrabold tracking-[-0.5px] text-[#C8F135]">
                            {priceRangeText}
                          </div>
                        </div>

                        <div className="pt-6">
                          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                            Country
                          </div>

                          <div className="mt-2 text-[18px] font-bold text-white">
                            {countryName}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </section>

        <TravelGuides
          title={`Training while traveling in ${countryName}?`}
          description={`Read our practical guides before buying a gym day pass or visiting a gym in ${countryName}.`}
          limit={2}
        />
    </main>
    <Footer />
</>
  );
}
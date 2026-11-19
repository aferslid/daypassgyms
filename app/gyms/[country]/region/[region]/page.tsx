import type { Metadata } from "next";
import Link from "next/link";
import countriesList from "world-countries";
import { notFound, permanentRedirect } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import Header from "../../../../components/Header";
import Footer from "@/app/components/Footer";
import CitiesGrid from "@/app/components/CitiesGrid";

export const revalidate = 3600;

type RegionPageProps = {
  params: Promise<{
    country: string;
    region: string;
  }>;
};

type Gym = {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  state_code: string | null;
};

type RegionDefinition = {
  code: string;
  name: string;
};

const REGIONS: Record<string, Record<string, RegionDefinition>> = {
  US: {
    alabama: { code: "AL", name: "Alabama" },
    alaska: { code: "AK", name: "Alaska" },
    arizona: { code: "AZ", name: "Arizona" },
    arkansas: { code: "AR", name: "Arkansas" },
    california: { code: "CA", name: "California" },
    colorado: { code: "CO", name: "Colorado" },
    connecticut: { code: "CT", name: "Connecticut" },
    delaware: { code: "DE", name: "Delaware" },
    "district-of-columbia": {
      code: "DC",
      name: "District of Columbia",
    },
    florida: { code: "FL", name: "Florida" },
    georgia: { code: "GA", name: "Georgia" },
    hawaii: { code: "HI", name: "Hawaii" },
    idaho: { code: "ID", name: "Idaho" },
    illinois: { code: "IL", name: "Illinois" },
    indiana: { code: "IN", name: "Indiana" },
    iowa: { code: "IA", name: "Iowa" },
    kansas: { code: "KS", name: "Kansas" },
    kentucky: { code: "KY", name: "Kentucky" },
    louisiana: { code: "LA", name: "Louisiana" },
    maine: { code: "ME", name: "Maine" },
    maryland: { code: "MD", name: "Maryland" },
    massachusetts: { code: "MA", name: "Massachusetts" },
    michigan: { code: "MI", name: "Michigan" },
    minnesota: { code: "MN", name: "Minnesota" },
    mississippi: { code: "MS", name: "Mississippi" },
    missouri: { code: "MO", name: "Missouri" },
    montana: { code: "MT", name: "Montana" },
    nebraska: { code: "NE", name: "Nebraska" },
    nevada: { code: "NV", name: "Nevada" },
    "new-hampshire": { code: "NH", name: "New Hampshire" },
    "new-jersey": { code: "NJ", name: "New Jersey" },
    "new-mexico": { code: "NM", name: "New Mexico" },
    "new-york": { code: "NY", name: "New York" },
    "north-carolina": { code: "NC", name: "North Carolina" },
    "north-dakota": { code: "ND", name: "North Dakota" },
    ohio: { code: "OH", name: "Ohio" },
    oklahoma: { code: "OK", name: "Oklahoma" },
    oregon: { code: "OR", name: "Oregon" },
    pennsylvania: { code: "PA", name: "Pennsylvania" },
    "rhode-island": { code: "RI", name: "Rhode Island" },
    "south-carolina": { code: "SC", name: "South Carolina" },
    "south-dakota": { code: "SD", name: "South Dakota" },
    tennessee: { code: "TN", name: "Tennessee" },
    texas: { code: "TX", name: "Texas" },
    utah: { code: "UT", name: "Utah" },
    vermont: { code: "VT", name: "Vermont" },
    virginia: { code: "VA", name: "Virginia" },
    washington: { code: "WA", name: "Washington" },
    "west-virginia": { code: "WV", name: "West Virginia" },
    wisconsin: { code: "WI", name: "Wisconsin" },
    wyoming: { code: "WY", name: "Wyoming" },
  },

  CA: {
    alberta: { code: "AB", name: "Alberta" },
    "british-columbia": {
      code: "BC",
      name: "British Columbia",
    },
    manitoba: { code: "MB", name: "Manitoba" },
    "new-brunswick": { code: "NB", name: "New Brunswick" },
    "newfoundland-and-labrador": {
      code: "NL",
      name: "Newfoundland and Labrador",
    },
    "nova-scotia": { code: "NS", name: "Nova Scotia" },
    "northwest-territories": {
      code: "NT",
      name: "Northwest Territories",
    },
    nunavut: { code: "NU", name: "Nunavut" },
    ontario: { code: "ON", name: "Ontario" },
    "prince-edward-island": {
      code: "PE",
      name: "Prince Edward Island",
    },
    quebec: { code: "QC", name: "Quebec" },
    saskatchewan: {
      code: "SK",
      name: "Saskatchewan",
    },
    yukon: { code: "YT", name: "Yukon" },
  },
  AU: {
    "new-south-wales": {
        code: "NSW",
        name: "New South Wales",
    },
    victoria: {
        code: "VIC",
        name: "Victoria",
    },
    queensland: {
        code: "QLD",
        name: "Queensland",
    },
    "western-australia": {
        code: "WA",
        name: "Western Australia",
    },
    "south-australia": {
        code: "SA",
        name: "South Australia",
    },
    tasmania: {
        code: "TAS",
        name: "Tasmania",
    },
    "australian-capital-territory": {
        code: "ACT",
        name: "Australian Capital Territory",
    },
    "northern-territory": {
        code: "NT",
        name: "Northern Territory",
    },
    },
};

function resolveCountryFromSlug(slug: string) {
  const normalizedSlug = slug.toLowerCase();

  const specialCases: Record<string, string> = {
    usa: "US",
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

function resolveRegion(countryCode: string, regionSlug: string) {
  return REGIONS[countryCode]?.[regionSlug.toLowerCase()] || null;
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { country, region } = await params;

  const resolvedCountry = resolveCountryFromSlug(country);

  if (!resolvedCountry) {
    return {
      title: "Region not found",
    };
  }

  const resolvedRegion = resolveRegion(
    resolvedCountry.code,
    region
  );

  if (!resolvedRegion) {
    return {
      title: "Region not found",
    };
  }

  const title =
    `Gym Day Passes in ${resolvedRegion.name}, ${resolvedCountry.name}`;

  const description =
    `Find gyms offering day passes across ${resolvedRegion.name}, ${resolvedCountry.name}. ` +
    `Browse cities, compare gym options and find flexible single-visit access.`;

  const canonicalUrl =
    `https://www.daypassgyms.com/gyms/` +
    `${resolvedCountry.canonicalSlug}/region/${slugify(resolvedRegion.name)}`;

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: `${title} | DayPassGyms`,
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
      title: `${title} | DayPassGyms`,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function RegionPage({
  params,
}: RegionPageProps) {
  const { country, region } = await params;

  const resolvedCountry = resolveCountryFromSlug(country);

  if (!resolvedCountry) {
    notFound();
  }

  const resolvedRegion = resolveRegion(
    resolvedCountry.code,
    region
  );

  if (!resolvedRegion) {
    notFound();
  }

  const canonicalRegionSlug = slugify(resolvedRegion.name);

  if (
    country.toLowerCase() !== resolvedCountry.canonicalSlug ||
    region.toLowerCase() !== canonicalRegionSlug
  ) {
    permanentRedirect(
      `/gyms/${resolvedCountry.canonicalSlug}/region/${canonicalRegionSlug}`
    );
  }

  const { data, error } = await supabase
    .from("spots")
    .select("id, name, city, country, state_code")
    .eq("country", resolvedCountry.code)
    .eq("state_code", resolvedRegion.code)
    .order("city", { ascending: true });

  if (error) {
    throw error;
  }

  const gyms = (data || []) as Gym[];

  if (gyms.length === 0) {
    notFound();
  }

  const cityMap = new Map<
    string,
    {
      name: string;
      count: number;
    }
  >();

  gyms.forEach((gym) => {
    if (!gym.city) return;

    const key = gym.city.trim().toLowerCase();

    const existing = cityMap.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      cityMap.set(key, {
        name: gym.city.trim(),
        count: 1,
      });
    }
  });

  const cities = Array.from(cityMap.values()).sort(
    (a, b) =>
      b.count - a.count ||
      a.name.localeCompare(b.name)
  );

  const cityCount = cities.length;
  const gymCount = gyms.length;

  const regionUrl =
    `https://www.daypassgyms.com/gyms/` +
    `${resolvedCountry.canonicalSlug}/region/${canonicalRegionSlug}`;

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      `Cities with gym day passes in ${resolvedRegion.name}, ` +
      `${resolvedCountry.name}`,
    numberOfItems: cities.length,
    itemListElement: cities.map((city, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: city.name,
      url:
        `https://www.daypassgyms.com/gyms/` +
        `${resolvedCountry.canonicalSlug}/${slugify(city.name)}`,
    })),
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Gyms",
        item: "https://www.daypassgyms.com/gyms",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: resolvedCountry.name,
        item:
          `https://www.daypassgyms.com/gyms/` +
          `${resolvedCountry.canonicalSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: resolvedRegion.name,
        item: regionUrl,
      },
    ],
  };
  
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
        __html: JSON.stringify(breadcrumbStructuredData),
      }}
    />

    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0C0C0C]">

        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">

          <Header />

          <div className="pb-16 pt-14">

            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#888]">

              <Link
                href="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <span>→</span>

              <Link
                href="/gyms"
                className="transition hover:text-white"
              >
                Gyms
              </Link>

              <span>→</span>

              <Link
                href={`/gyms/${resolvedCountry.canonicalSlug}`}
                className="transition hover:text-white"
              >
                {resolvedCountry.name}
              </Link>

              <span>→</span>

              <span className="font-bold text-white">
                {resolvedRegion.name}
              </span>

            </div>

            <p className="mb-4 mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              State directory
            </p>

            <h1 className="max-w-4xl text-[56px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[72px]">
              Gym day passes in
              <br />
              <span className="text-[#C8F135]">
                {resolvedRegion.name}.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[#777]">
              Explore gym day passes across {resolvedRegion.name},{" "}
              {resolvedCountry.name}. Browse cities and find gyms offering
              single-visit or flexible visitor access.
            </p>

          </div>

        </div>

        {/* STATS BAR */}
        <div className="border-t border-[#1e1e1e] bg-[#111]">

          <div className="mx-auto max-w-7xl divide-x divide-[#1e1e1e] px-0 md:flex">

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {gymCount}
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                gyms listed
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {cityCount}
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                cities
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {resolvedCountry.name}
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                country
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                Day pass
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                visitor access
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* CITIES */}
    <section id="cities" className="mx-auto max-w-7xl px-6 py-14">
    <CitiesGrid
        cities={cities.map(
        (city) => [city.name, city.count] as [string, number]
        )}
        countryName={resolvedRegion.name}
        countrySlug={resolvedCountry.canonicalSlug}
    />
    </section>


      {/* SEO / REGION CONTENT */}
      <section className="border-t border-[#E4E4E1] bg-[#F7F7F5]">

        <div className="mx-auto max-w-7xl px-6 py-16">

          <div className="overflow-hidden rounded-[24px] border border-[#E4E4E1] bg-white">

            <div className="grid md:grid-cols-[1.5fr_0.7fr]">

              <div className="p-8 md:p-12">

                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8BAA00]">
                  TRAINING IN {resolvedRegion.name.toUpperCase()}
                </p>

                <h2 className="mt-3 max-w-xl text-[32px] font-extrabold leading-[1] tracking-[-1px] text-[#0C0C0C] md:text-[42px]">
                  Finding a gym day pass in {resolvedRegion.name}
                </h2>

                <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-[#666]">

                  <p>
                    DayPassGyms currently lists{" "}
                    <strong className="text-[#0C0C0C]">
                      {gymCount}{" "}
                      {gymCount === 1 ? "gym" : "gyms"}
                    </strong>{" "}
                    across {cityCount}{" "}
                    {cityCount === 1 ? "city" : "cities"} in{" "}
                    {resolvedRegion.name}.
                  </p>

                  <p>
                    Browse the cities above to compare gyms offering
                    day passes or flexible visitor access without committing
                    to a long-term membership.
                  </p>

                </div>

                <Link
                  href={`/gyms/${resolvedCountry.canonicalSlug}`}
                  className="mt-7 inline-flex items-center text-[14px] font-bold text-[#0C0C0C] transition hover:text-[#8BAA00]"
                >
                  Browse all gym day passes in {resolvedCountry.name} →
                </Link>

              </div>


              <div className="flex flex-col justify-center bg-[#0C0C0C] p-8 md:p-10">

                <div className="border-b border-[#242424] pb-6">

                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                    Gyms listed
                  </div>

                  <div className="mt-2 text-[38px] font-extrabold tracking-[-1.5px] text-[#C8F135]">
                    {gymCount}
                  </div>

                </div>


                <div className="border-b border-[#242424] py-6">

                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                    Cities
                  </div>

                  <div className="mt-2 text-[28px] font-extrabold tracking-[-0.5px] text-white">
                    {cityCount}
                  </div>

                </div>


                <div className="pt-6">

                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#777]">
                    Location
                  </div>

                  <div className="mt-2 text-[18px] font-bold text-white">
                    {resolvedRegion.name},{" "}
                    {resolvedCountry.name}
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>

    <Footer />
  </>
);
}

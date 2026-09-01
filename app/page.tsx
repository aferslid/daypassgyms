import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "@/app/components/Footer";
import Header from "./components/Header";
import countriesList from "world-countries";
import { slugify } from "@/lib/slugify";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "DayPassGyms | Find Gym Day Passes Worldwide",
  },

  description:
    "Find gyms offering day passes around the world. Compare prices, showers, lockers, Wi-Fi and locations before you train.",

  alternates: {
    canonical: "https://www.daypassgyms.com",
  },

  openGraph: {
    title: "DayPassGyms | Find Gym Day Passes Worldwide",
    description:
      "Find gyms offering day passes around the world. Compare prices, showers, lockers, Wi-Fi and locations before you train.",
    url: "https://www.daypassgyms.com",
    siteName: "DayPassGyms",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DayPassGyms — Find gym day passes worldwide",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "DayPassGyms | Find Gym Day Passes Worldwide",
    description:
      "Find gyms offering day passes around the world. Compare prices, showers, lockers, Wi-Fi and locations before you train.",
    images: ["/og-image.png"],
  },
};

async function fetchAll(select: string): Promise<any[]> {
  const pageSize = 1000;
  let from = 0;
  let rows: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("spots")
      .select(select)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    rows.push(...(data || []));

    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  return rows;
}

export default async function Home() {
  const { count: totalGyms } = await supabase
    .from("spots")
    .select("*", { count: "exact", head: true });

  const countriesData = (await fetchAll("country"))
  .filter((row) => row.country);

  const citiesData = (await fetchAll("country, city"))
  .filter((row) => row.country && row.city);

  const countriesCount = new Set(
    (countriesData || []).map((row) =>
      String(row.country).trim().toUpperCase()
    )
  ).size;

  const citiesCount = new Set(
    (citiesData || []).map(
      (row) =>
        `${String(row.country).trim().toUpperCase()}-${String(row.city)
          .trim()
          .toLowerCase()}`
    )
  ).size;

  const countryCounts = new Map<string, number>();

countriesData.forEach((row) => {
  const code = String(row.country).trim().toUpperCase();

  countryCounts.set(
    code,
    (countryCounts.get(code) || 0) + 1
  );
});

const topCountries = Array.from(countryCounts.entries())
  .map(([code, count]) => {
    const country = countriesList.find(
      (item) => item.cca2.toUpperCase() === code
    );

    const specialCases: Record<string, string> = {
      TR: "Turkey",
      SX: "Sint Maarten",
      MF: "Saint Martin",
    };

    return {
      code,
      name:
        specialCases[code] ||
        country?.name.common ||
        code,
      count,
    };
  })
  .sort((a, b) => b.count - a.count)
  .slice(0, 8);

const maxCountryCount =
  topCountries.length > 0
    ? topCountries[0].count
    : 1;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I use a gym without a membership?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Many gyms offer day passes that let you train without a monthly membership.",
        },
      },
      {
        "@type": "Question",
        name: "How much does a gym day pass cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It depends on the city and gym. DayPassGyms helps you compare listed day pass prices.",
        },
      },
      {
        "@type": "Question",
        name: "Do day pass gyms have showers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Some gyms have showers and some do not. We show shower information when it is available.",
        },
      },
      {
        "@type": "Question",
        name: "Can I suggest a gym?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Use the Suggest a gym page to send us a gym that offers day passes.",
        },
      },
    ],
  };

  return (
    <>
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

          <div className="pb-20 pt-16">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Global gym day-pass directory
            </p>

            <h1 className="max-w-3xl text-[58px] font-extrabold leading-[0.93] tracking-[-2.5px] text-white md:text-[82px]">
              Find a gym day pass<br />
              <span className="text-[#C8F135]">anywhere.</span>
            </h1>

            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
              Find a gym day pass near you or while traveling. Browse by country,
              compare day-pass prices, check showers and train on your terms.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/gyms"
                className="rounded-[8px] bg-[#C8F135] px-5 py-2.5 text-[13px] font-bold text-[#0C0C0C] transition hover:opacity-90"
              >
                Find a gym day pass
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
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[#1e1e1e] px-0 md:grid-cols-4 md:divide-y-0">
            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {totalGyms || 0}+
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                gyms listed
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {countriesCount}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                countries
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {citiesCount}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                cities
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

      <section id="how" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
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
            ["Browse gym day passes", "Find gyms with day passes by country and city."],
            ["Check the essentials", "See day-pass price, shower info and location."],
            ["Open the map", "Use the map to find a gym day pass near you."],
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

      

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
            Before you go
          </p>

          <h2 className="mt-1 text-[28px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
            What to check before visiting a gym.
          </h2>

          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#777]">
            Day-pass rules can vary between gyms. A few quick checks can save
            you from a wasted trip.
          </p>
        </div>

        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {[
            {
              icon: "🪪",
              title: "Bring an ID",
              text: "Some gyms require a passport or official ID before issuing visitor access.",
            },
            {
              icon: "🕒",
              title: "Check staffed hours",
              text: "A 24-hour gym may only sell day passes while reception is open.",
            },
            {
              icon: "🧺",
              title: "Bring a towel",
              text: "Some gyms require a towel during training or on benches and machines.",
            },
            {
              icon: "👟",
              title: "Pack indoor shoes",
              text: "Certain gyms require clean training shoes that have not been worn outdoors.",
            },
            {
              icon: "📱",
              title: "Check online access",
              text: "Some gyms let you buy a pass online and enter with a temporary code.",
            },
            {
              icon: "🌍",
              title: "Rules vary",
              text: "Visitor policies can differ by country, chain and even individual branch.",
            },
            {
              icon: "💳",
              title: "Taxes may apply",
              text: "Some gyms display prices before taxes, while others include them. Check before paying.",
            },
            {
              icon: "🔒",
              title: "Locker access",
              text: "Some gyms provide locks, while others require your own padlock or only offer open cubbies.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[14px] border border-[#EBEBEB] bg-white p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F1F5DF] text-[20px]">
                {item.icon}
              </div>

              <h3 className="mt-4 text-[16px] font-extrabold tracking-[-0.4px] text-[#111]">
                {item.title}
              </h3>

              <p className="mt-2 text-[13px] leading-relaxed text-[#777]">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href="/blog/how-to-use-a-gym-day-pass-while-traveling"
            className="inline-flex items-center rounded-[10px] bg-[#0C0C0C] px-5 py-3 text-[13px] font-bold text-white transition hover:bg-[#202020]"
          >
            Read the full travel gym guide →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="overflow-hidden rounded-[24px] border border-[#E4E4E1] bg-white">
          <div className="grid lg:grid-cols-[0.75fr_1.25fr]">

            <div className="flex flex-col bg-[#0C0C0C] p-8 md:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
                DAYPASSGYMS DATA
              </p>

              <h2 className="mt-3 text-[34px] font-extrabold leading-[1] tracking-[-1.2px] text-white md:text-[46px]">
                A global directory,
                <br />
                built city by city.
              </h2>

              <p className="mt-5 max-w-md text-[14px] leading-7 text-[#999]">
                DayPassGyms tracks gyms offering day passes and flexible access
                around the world.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
                <div>
                  <div className="text-[32px] font-extrabold tracking-[-1px] text-[#C8F135]">
                    {totalGyms || 0}+
                  </div>
                  <div className="mt-1 text-[11px] text-[#777]">
                    gyms listed
                  </div>
                </div>

                <div>
                  <div className="text-[32px] font-extrabold tracking-[-1px] text-white">
                    {countriesCount}
                  </div>
                  <div className="mt-1 text-[11px] text-[#777]">
                    countries
                  </div>
                </div>

                <div>
                  <div className="text-[32px] font-extrabold tracking-[-1px] text-white">
                    {citiesCount}
                  </div>
                  <div className="mt-1 text-[11px] text-[#777]">
                    cities
                  </div>
                </div>

                <div>
                  <div className="text-[32px] font-extrabold tracking-[-1px] text-[#C8F135]">
                    100%
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-[#777]">
                    displayed prices verified
                  </div>
                </div>
              </div>

              <div className="mt-9 border-t border-[#242424] pt-6">
                <p className="max-w-sm text-[11px] leading-5 text-[#666]">
                  Prices shown on DayPassGyms are checked against official gym sources.
                </p>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8BAA00]">
                EXPLORE OUR COVERAGE
              </p>

              <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.7px] text-[#0C0C0C]">
                Popular countries on DayPassGyms
              </h3>

              <div className="mt-8 space-y-5">
                {topCountries.map((country) => (
                  <Link
                    key={country.code}
                    href={`/gyms/${slugify(country.name)}`}
                    className="group block"
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-[13px] font-bold text-[#333] transition group-hover:text-[#8BAA00]">
                        {country.name}
                      </span>

                      <span className="text-[12px] font-bold text-[#888]">
                        {country.count} gyms
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#EFEFEB]">
                      <div
                        className="h-full rounded-full bg-[#C8F135] transition-opacity group-hover:opacity-70"
                        style={{
                          width: `${Math.max(
                            4,
                            (country.count / maxCountryCount) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-4 border-t border-[#EFEFEB] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-[11px] leading-5 text-[#999]">
                  Counts reflect gyms currently listed on DayPassGyms, not the total
                  number of day-pass gyms in each country.
                </p>

                <Link
                  href="/gyms"
                  className="shrink-0 text-[12px] font-bold text-[#0C0C0C] hover:text-[#8BAA00]"
                >
                  Explore all countries →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
      <p className="inline-flex rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
        FAQ
      </p>

      <h2 className="mt-3 text-[36px] font-extrabold tracking-[-1px] text-[#0C0C0C]">
        Gym day pass questions
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          {
            q: "Can I use a gym without a membership?",
            a: "Yes. Many gyms offer day passes that let you train without a monthly membership.",
          },
          {
            q: "How much does a gym day pass cost?",
            a: "Gym day pass prices vary by country, city and gym. DayPassGyms helps you compare listed day pass prices before you visit.",
          },
          {
            q: "Do day pass gyms have showers?",
            a: "Some gyms have showers and some do not. We show shower information when it is available.",
          },
          {
            q: "Can I suggest a gym?",
            a: "Yes. Use the Suggest a gym page to send us a gym that offers day passes.",
          },
        ].map((item) => (
          <div key={item.q} className="rounded-[16px] border border-[#EBEBEB] bg-white p-6">
            <h3 className="font-extrabold text-[#0C0C0C]">{item.q}</h3>
            <p className="mt-2 text-sm leading-6 text-[#777]">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
    </main>
    
    <Footer />
    </>
  );
}
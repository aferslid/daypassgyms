import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "@/app/components/Footer";
import Header from "./components/Header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "DayPassGyms | Find Gym Day Passes Worldwide",
  },

  description:
    "Find gyms offering day passes around the world. Compare prices, showers, lockers, Wi-Fi and locations before you train.",

  alternates: {
    canonical: "https://daypassgyms.com",
  },

  openGraph: {
    title: "DayPassGyms | Find Gym Day Passes Worldwide",
    description:
      "Find gyms offering day passes around the world. Compare prices, showers, lockers, Wi-Fi and locations before you train.",
    url: "https://daypassgyms.com",
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
      .ilike("type", "%gym%")
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
    .select("*", { count: "exact", head: true })
    .ilike("type", "%gym%");

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
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[#1e1e1e] px-0 md:grid-cols-4 md:divide-y-0">
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
                {citiesCount}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                cities
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
      <section className="mx-auto max-w-7xl px-6 py-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
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
            a: "It depends on the city and gym. DayPassGyms helps you compare listed day pass prices.",
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
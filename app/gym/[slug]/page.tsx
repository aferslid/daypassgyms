import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import GymMiniMapClient from "@/app/components/GymMiniMapClient";
import Footer from "@/app/components/Footer";
import Header from "../../components/Header";

type GymPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Gym = {
  id: number;
  name: string;
  description: string | null;
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  created_at: string | null;
  google_name: string | null;
  phone: string | null;
  address: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  country_full: string | null;
  details: {
    day_pass_price?: number | null;
    currency?: string | null;
    shower?: boolean | null;
  } | null;
};

export async function generateMetadata({ params }: GymPageProps) {
  const { slug } = await params;
  const gymId = getIdFromSlug(slug);

  const { data: gym } = await supabase
    .from("spots")
    .select("name, details")
    .eq("id", gymId)
    .single();

  if (!gym) {
    return {
      title: "Gym not found",
    };
  }

  const price = gym.details?.day_pass_price
    ? `${gym.details.day_pass_price} ${gym.details.currency || ""}`
    : "day pass";

  return {
    title: `${gym.name} Day Pass Price | Gym Day Pass Map`,
    description: `Check ${gym.name} day pass info, price, shower availability and location.`,
  };
}

function getIdFromSlug(slug: string) {
  const parts = slug.split("-");
  return Number(parts[parts.length - 1]);
}

function formatPrice(details: Gym["details"]) {
  if (!details?.day_pass_price) return "Price unknown";

  return `${new Intl.NumberFormat().format(details.day_pass_price)} ${
    details.currency || ""
  }`;
}

function formatShower(details: Gym["details"]) {
  if (details?.shower === true) return "Shower available";
  if (details?.shower === false) return "No shower";
  return "Shower unknown";
}

function getCountryName(code: string | null) {
  if (!code) return "";

  const country = countriesList.find(
    (c) => c.cca2.toUpperCase() === code.toUpperCase()
  );

  return country?.name.common || code;
}

function getFlagEmoji(countryCode: string | null) {
  if (!countryCode) return "🌍";

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

export default async function GymPage({ params }: GymPageProps) {
  const { slug } = await params;
  const gymId = getIdFromSlug(slug);

  const { data: gym, error } = await supabase
    .from("spots")
    .select("id, name, description, country, city, lat, lng, photo_url, created_at, google_name, phone, address, website_url, google_maps_url, country_full, details")
    .eq("id", gymId)
    .single();

  if (error || !gym) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <Link href="/gyms" className="text-sm text-neutral-400 hover:text-white">
            ← Back to gyms
          </Link>

          <h1 className="mt-8 text-4xl font-bold">Gym not found</h1>
        </div>
      </main>
    );
  }

  const typedGym = gym as Gym;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Gym",
    name: typedGym.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: typedGym.city,
      addressCountry: typedGym.country,
    },
    url: typedGym.website_url,
    sameAs: typedGym.google_maps_url,
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
    <main className="min-h-screen bg-[#F7F7F5] font-[family-name:var(--font-space)]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="pointer-events-none absolute -right-10 -top-20 h-80 w-80 rounded-full bg-[#C8F135]/5" />
        <div className="pointer-events-none absolute right-16 top-8 h-44 w-44 rounded-full bg-[#C8F135]/[0.03]" />

        <div className="relative mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="grid gap-10 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Link
                href="/gyms"
                className="mb-5 inline-block text-[13px] font-medium text-[#777] hover:text-white"
              >
                ← Back to gyms
              </Link>

              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
                Gym profile
              </p>

              <h1 className="max-w-3xl text-[48px] font-extrabold leading-[0.95] tracking-[-2px] text-white md:text-[68px]">
                {typedGym.name}
              </h1>

              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
                Day-pass gym information for travelers. Check price, shower
                availability and location before you go.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#C8F135] px-4 py-2 text-[12px] font-bold text-[#0C0C0C]">
                  💰 {formatPrice(typedGym.details)}
                </span>

                <span className="rounded-full border border-[#2a2a2a] bg-white/5 px-4 py-2 text-[12px] font-bold text-[#aaa]">
                  🚿 {formatShower(typedGym.details)}
                </span>

                {typedGym.city && (
                  <span className="rounded-full border border-[#2a2a2a] bg-white/5 px-4 py-2 text-[12px] font-bold text-[#aaa]">
                    📍 {typedGym.city}
                  </span>
                )}

                {typedGym.country && (
                  <span className="rounded-full border border-[#2a2a2a] bg-white/5 px-4 py-2 text-[12px] font-bold text-[#aaa]">
                    {getCountryName(typedGym.country)}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#1e1e1e] bg-[#111] p-4">
              {typedGym.photo_url ? (
                <img
                  src={typedGym.photo_url}
                  alt={typedGym.name}
                  className="h-[320px] w-full rounded-[18px] object-cover"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center rounded-[18px] bg-[#171717] text-[#555]">
                  Photo coming soon
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] bg-[#111]">
          <div className="mx-auto max-w-7xl divide-x divide-[#1e1e1e] px-0 md:flex">
            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {formatPrice(typedGym.details)}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                day pass
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {formatShower(typedGym.details)}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                shower info
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {typedGym.city || "Unknown"}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#555]">
                city
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

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-[16px] border border-[#EBEBEB] bg-white p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Details
            </p>

            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
              Gym information
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                <div className="text-[11px] text-[#999]">Day pass price</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                  {formatPrice(typedGym.details)}
                </div>
              </div>

              <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                <div className="text-[11px] text-[#999]">Shower</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                  {formatShower(typedGym.details)}
                </div>
              </div>

              <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                <div className="text-[11px] text-[#999]">City</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                  {typedGym.city || "Unknown"}
                </div>
              </div>

              <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                <div className="text-[11px] text-[#999]">Country</div>
                <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                  {getCountryName(typedGym.country)}
                </div>
              </div>
              
              {typedGym.google_name && (
                <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                  <div className="text-[11px] text-[#999]">Google Maps name</div>
                  <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                    {typedGym.google_name}
                  </div>
                </div>
              )}

              {typedGym.address && (
                <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                  <div className="text-[11px] text-[#999]">Address</div>
                  <div className="mt-1 text-[15px] font-extrabold leading-snug text-[#111]">
                    {typedGym.address}
                  </div>
                </div>
              )}

              {typedGym.phone && (
                <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                  <div className="text-[11px] text-[#999]">Phone</div>
                  <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                    {typedGym.phone}
                  </div>
                </div>
              )}
            </div>

            {typedGym.created_at && (
              <p className="mt-5 text-[12px] text-[#999]">
                Price info checked around{" "}
                {new Date(typedGym.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </div>

          <div className="rounded-[16px] border border-[#EBEBEB] bg-white p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Notes
            </p>

            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
              Description
            </h2>

            {typedGym.description ? (
              <p className="mt-5 whitespace-pre-line text-[14px] leading-relaxed text-[#666]">
                {typedGym.description}
              </p>
            ) : (
              <p className="mt-5 text-[14px] text-[#999]">
                No description available yet.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {typedGym.lat !== null && typedGym.lng !== null && (
            <div className="rounded-[16px] border border-[#EBEBEB] bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
                Location
              </p>

              <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px] text-[#0C0C0C]">
                Find this gym
              </h2>

              <iframe
                className="mt-5 h-[260px] w-full rounded-[12px]"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${typedGym.lat},${typedGym.lng}&z=15&output=embed`}
              />

              <a
                href={
                  typedGym.google_maps_url ||
                  `https://www.google.com/maps?q=${typedGym.lat},${typedGym.lng}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-[10px] bg-[#0C0C0C] px-5 py-3 text-center text-[13px] font-bold text-white transition hover:bg-[#222]"
              >
                Open in Google Maps →
              </a>

              {typedGym.website_url && (
                <a
                  href={typedGym.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block rounded-[10px] border border-[#EBEBEB] bg-white px-5 py-3 text-center text-[13px] font-bold text-[#111] hover:bg-[#F2F2F0]"
                >
                  Visit website →
                </a>
              )}

              {typedGym.phone && (
                <a
                  href={`tel:${typedGym.phone}`}
                  className="mt-3 block rounded-[10px] border border-[#EBEBEB] bg-white px-5 py-3 text-center text-[13px] font-bold text-[#111] hover:bg-[#F2F2F0]"
                >
                  Call gym →
                </a>
              )}
            </div>
          )}

          <div className="rounded-[16px] border border-[#EBEBEB] bg-[#0C0C0C] p-6 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Data
            </p>

            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.5px]">
              Help improve this listing
            </h2>

            <p className="mt-4 text-[13px] leading-relaxed text-[#777]">
              Opening hours, address, website and photos will be added
              progressively.
            </p>
          </div>
        </aside>
      </section>
    </main>
    <Footer />
</>
  );
}
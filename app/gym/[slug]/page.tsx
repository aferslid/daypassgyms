export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import countriesList from "world-countries";
import GymMiniMapClient from "@/app/components/GymMiniMapClient";
import Footer from "@/app/components/Footer";
import Header from "../../components/Header";
import { notFound, redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import Breadcrumbs, {
  type BreadcrumbItem,
} from "@/app/components/Breadcrumbs";
import { slugify } from "@/lib/slugify";

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
  free_trial: boolean | null;
  free_trial_duration: string | null;
  week_pass_price: number | null;
  access_gender: string | null;
  details: {
    day_pass_price?: number | null;
    currency?: string | null;
    shower?: boolean | null;
    pool: boolean | null;
    wifi: boolean | null;
    locker: boolean | null;
  } | null;
};

type RelatedGym = {
  id: number;
  name: string;
  country: string | null;
  country_full: string | null;
  city: string | null;
  details: Gym["details"];
};

export async function generateMetadata({ params }: GymPageProps) {
  const { slug } = await params;
  const gymId = getIdFromSlug(slug);

  const { data: gym } = await supabase
    .from("spots")
    .select("id, name, city, country_full, details")
    .eq("id", gymId)
    .single();

  if (!gym) {
    return {
      title: "Gym not found",
      description: "This gym listing could not be found.",
    };
  }

  const price =
    gym.details?.day_pass_price && gym.details?.currency
      ? `${gym.details.day_pass_price} ${gym.details.currency}`
      : null;

  const locationLabel = [gym.city, gym.country_full].filter(Boolean).join(", ");

  const description = price
    ? `View the ${price} day pass price for ${gym.name}${locationLabel ? ` in ${locationLabel}` : ""}. Check showers, lockers, Wi-Fi, facilities and visitor access information.`
    : `View day pass information for ${gym.name}${locationLabel ? ` in ${locationLabel}` : ""}. Check showers, lockers, Wi-Fi, facilities and visitor access details.`;

  const locationParts = [gym.city, gym.country_full].filter(Boolean);
  const locationText =
    locationParts.length > 0 ? ` | ${locationParts.join(", ")}` : "";

  const title = `${gym.name} Day Pass Price${locationText}`;
  const canonicalSlug = `${slugify(gym.name)}-${gym.id}`;

  const canonicalUrl =
    `https://www.daypassgyms.com/gym/${canonicalSlug}`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "DayPassGyms",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },

    alternates: {
      canonical: canonicalUrl,
    },
  };
}

function getIdFromSlug(slug: string) {
  const parts = slug.split("-");
  return Number(parts[parts.length - 1]);
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
  if (details?.shower === true) return "Yes";
  if (details?.shower === false) return "No";
  return "Unknown";
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

function getFlagEmoji(countryCode: string | null) {
  if (!countryCode) return "🌍";

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

function RelatedGymCard({ gym }: { gym: RelatedGym }) {
  return (
    <Link
      href={`/gym/${slugify(gym.name)}-${gym.id}`}
      className="group rounded-[14px] border border-[#E2E2DD] bg-[#F7F7F5] p-5 transition hover:-translate-y-1 hover:border-[#C8F135]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E9700]">
        {gym.city || "Gym"}
      </p>

      <h3 className="mt-3 text-[17px] font-extrabold leading-tight tracking-[-0.4px] text-[#111] group-hover:underline">
        {gym.name}
      </h3>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#555]">
          {formatPrice(gym.details)}
        </span>

        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#555]">
          Shower: {formatShower(gym.details)}
        </span>
      </div>

      <p className="mt-5 text-[12px] font-bold text-[#111]">
        View gym →
      </p>
    </Link>
  );
}

export default async function GymPage({ params }: GymPageProps) {
  const { slug } = await params;
  const gymId = getIdFromSlug(slug);

  if (!gymId) {
    notFound();
  }

  const { data: gym, error } = await supabase
    .from("spots")
    .select("id, name, description, country, city, lat, lng, photo_url, created_at, google_name, phone, address, website_url, google_maps_url, country_full, details, free_trial, free_trial_duration, week_pass_price, access_gender")
    .eq("id", gymId)
    .single();

  if (error || !gym) {
    notFound();
  }

  const typedGym = gym as Gym;

  const canonicalSlug = `${slugify(typedGym.name)}-${typedGym.id}`;

  if (slug !== canonicalSlug) {
    redirect(`/gym/${canonicalSlug}`);
  }

  const countryName =
  typedGym.country_full || getCountryName(typedGym.country);

const countrySlug = slugify(countryName);

const breadcrumbItems: BreadcrumbItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Gyms",
    href: "/gyms",
  },
];

if (typedGym.country) {
  breadcrumbItems.push({
    label: countryName,
    href: `/gyms/${countrySlug}`,
  });
}

if (typedGym.country && typedGym.city) {
  breadcrumbItems.push({
    label: typedGym.city,
    href: `/gyms/${countrySlug}/${slugify(typedGym.city)}`,
  });
}

breadcrumbItems.push({
  label: typedGym.name,
  href: `/gym/${slug}`,
});

  const baseUrl = "https://www.daypassgyms.com";
  const gymUrl = `${baseUrl}/gym/${slug}`;

  const gymStructuredData = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: typedGym.name,
    url: gymUrl,

    ...(typedGym.description && {
      description: typedGym.description,
    }),

    ...(typedGym.website_url && {
      sameAs: [typedGym.website_url],
    }),

    ...(typedGym.phone && {
      telephone: typedGym.phone,
    }),

    ...(typedGym.address || typedGym.city || typedGym.country_full
      ? {
          address: {
            "@type": "PostalAddress",
            ...(typedGym.address && {
              streetAddress: typedGym.address,
            }),
            ...(typedGym.city && {
              addressLocality: typedGym.city,
            }),
            ...(typedGym.country_full || typedGym.country
              ? {
                  addressCountry:
                    typedGym.country_full || typedGym.country,
                }
              : {}),
          },
        }
      : {}),

    ...(typedGym.lat !== null && typedGym.lng !== null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: typedGym.lat,
            longitude: typedGym.lng,
          },
        }
      : {}),

    ...(typedGym.photo_url && {
      image: typedGym.photo_url,
    }),

    ...(typedGym.google_maps_url && {
      hasMap: typedGym.google_maps_url,
    }),

    ...(typedGym.details?.day_pass_price &&
    typedGym.details?.currency
      ? {
          makesOffer: {
            "@type": "Offer",
            name: "Gym day pass",
            price: typedGym.details.day_pass_price,
            priceCurrency: typedGym.details.currency,
            url: gymUrl,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  const cityGyms: RelatedGym[] = [];

  if (typedGym.country && typedGym.city) {
    const { data: cityResults, error: cityError } = await supabase
      .from("spots")
      .select("id, name, country, country_full, city, details")
      .ilike("type", "%gym%")
      .eq("country", typedGym.country)
      .ilike("city", typedGym.city)
      .neq("id", typedGym.id)
      .order("id")
      .limit(4);

    if (!cityError && cityResults) {
      cityGyms.push(...(cityResults as RelatedGym[]));
    }
  }

  const gymImageUrl = `/images/gyms/${slug}.jpg`;

  const gymImagePath = path.join(
    process.cwd(),
    "public",
    "images",
    "gyms",
    `${slug}.jpg`
  );

  const hasGymImage = fs.existsSync(gymImagePath);

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(gymStructuredData).replace(/</g, "\\u003c"),
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
              <Breadcrumbs light items={breadcrumbItems} />

              <p className="mb-4 mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
                Gym profile
              </p>

              <h1 className="max-w-3xl text-[48px] font-extrabold leading-[0.95] tracking-[-2px] text-white md:text-[68px]">
                {typedGym.name}
              </h1>

              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#777]">
                Check the gym day pass price for {typedGym.name}. See shower
                availability, facilities and location before you go.
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
              <div className="rounded-[24px] border border-[#1e1e1e] bg-[#111] p-4">
                {hasGymImage ? (
                  <img
                    src={gymImageUrl}
                    alt={typedGym.name}
                    className="h-[320px] w-full rounded-[18px] object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center rounded-[18px] bg-[#171717] text-[#888]">
                    Photo coming soon
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] bg-[#111]">
          <div className="mx-auto max-w-7xl divide-x divide-[#1e1e1e] px-0 md:flex">
            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135]">
                {formatPrice(typedGym.details)}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                day pass
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {typedGym.week_pass_price !== null &&
                typedGym.week_pass_price !== undefined
                  ? `${Number(typedGym.week_pass_price).toLocaleString("en-US")} ${typedGym.details?.currency ?? ""}`
                  : "Unknown"}
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                week pass
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div
                className={`text-[26px] font-extrabold leading-none tracking-[-1px] text-[#C8F135] ${
                  typedGym.free_trial ? "text-[#C8F135]" : "text-white"
                }`}
              >
                {typedGym.free_trial === true
                  ? typedGym.free_trial_duration || "Available"
                  : typedGym.free_trial === false
                    ? "No"
                    : "Unknown"}
              </div>

              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                free trial
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <div className="text-[26px] font-extrabold leading-none tracking-[-1px] text-white">
                {formatShower(typedGym.details)}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.04em] text-[#888]">
                showers
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
                <div className="text-[11px] text-[#999]">Day pass</div>
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

              {typedGym.details?.pool != null && typedGym.details?.pool !== undefined && (
                <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                  <div className="text-[11px] text-[#999]">
                    Pool
                  </div>

                  <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                    {typedGym.details?.pool ? "Available" : "Not available"}
                  </div>
                </div>
              )}

              {typedGym.details?.locker !== null && typedGym.details?.locker !== undefined && (
                <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                  <div className="text-[11px] text-[#999]">
                    Locker
                  </div>

                  <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                    {typedGym.details?.locker ? "Available" : "Not available"}
                  </div>
                </div>
              )}

              <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                <div className="text-[11px] text-[#999]">Wi-Fi</div>

                <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                  {typedGym.details?.wifi === true
                    ? "Available"
                    : typedGym.details?.wifi === false
                    ? "Not available"
                    : "Unknown"}
                </div>
              </div>

              {typedGym.access_gender && (
                <div className="rounded-[12px] bg-[#F2F2F0] p-4">
                  <div className="text-[11px] text-[#999]">
                    Gender (men/women/mixed)
                  </div>

                  <div className="mt-1 text-[18px] font-extrabold text-[#111]">
                    {typedGym.access_gender === "mixed"
                      ? "Mixed"
                      : typedGym.access_gender === "women_only"
                      ? "Women only"
                      : typedGym.access_gender === "men_only"
                      ? "Men only"
                      : typedGym.access_gender}
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
                We're gradually adding descriptions and extra information for all gyms.
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
                  href={`tel:${typedGym.phone.replace(/\s/g, "")}`}
                  className="mt-3 block rounded-[10px] border border-[#EBEBEB] bg-white px-5 py-3 text-center text-[13px] font-bold text-[#0C0C0C]"
                >
                  Call gym →
                </a>
              )}
            </div>
          )}

          <div className="rounded-[16px] border border-[#0C0C0C] bg-[#0C0C0C] p-6 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
              Data
            </p>

            <h3 className="mt-3 text-[24px] font-extrabold">
              Help improve this listing
            </h3>

            <p className="mt-4 text-[13px] leading-relaxed text-[#999]">
              Found outdated prices, missing opening hours or better information? Send an update and help travelers.
            </p>

            <Link
              href={`/suggest?type=update&gym=${encodeURIComponent(
                gym.name
              )}&city=${encodeURIComponent(
                gym.city || ""
              )}&country=${encodeURIComponent(
                gym.country_full || gym.country || ""
              )}`}
              rel="nofollow"
            >
              Suggest an update
            </Link>
          </div>
        </aside>
      </section>
      {typedGym.country && (
        <>
          <div className="mx-auto max-w-7xl px-6">
            <div className="border-t border-[#D7D7D0]" />
            <div className="mt-2 border-t border-[#D7D7D0]" />
          </div>

          <section className="bg-[#F1F1EC] py-16">
            <div className="mx-auto max-w-7xl px-6">
              {cityGyms.length > 0 && typedGym.city && (
                <div>
                  <p className="inline-flex w-fit rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
                    Nearby options
                  </p>

                  <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <h2 className="text-[28px] font-extrabold tracking-[-1px] text-[#0C0C0C]">
                        Other gyms in {typedGym.city}
                      </h2>

                      <p className="mt-2 text-[14px] leading-relaxed text-[#777]">
                        Compare other day-pass gyms available in the same city.
                      </p>
                    </div>

                    <Link
                      href={`/gyms/${slugify(
                        typedGym.country_full || getCountryName(typedGym.country)
                      )}/${slugify(typedGym.city)}`}
                      className="text-[13px] font-bold text-[#111] hover:underline"
                    >
                      View all gym day passes in {typedGym.city} →
                    </Link>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cityGyms.map((cityGym) => (
                      <RelatedGymCard key={cityGym.id} gym={cityGym} />
                    ))}
                  </div>
                </div>
              )}

              <div
                className={
                  cityGyms.length > 0
                    ? "mt-12 border-t border-[#D7D7D0] pt-10"
                    : ""
                }
              >
                <p className="inline-flex w-fit rounded-full bg-[#2F380B] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C8F135]">
                  Explore the country
                </p>

                <div className="mt-4 flex flex-col justify-between gap-4 rounded-[16px] border border-[#DDDDD6] bg-white p-6 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-[24px] font-extrabold tracking-[-0.7px] text-[#0C0C0C]">
                      Browse gym day passes in{" "}
                      {typedGym.country_full || getCountryName(typedGym.country)}
                    </h2>

                    <p className="mt-2 text-[14px] leading-relaxed text-[#777]">
                      Explore all listed cities and day-pass gyms across the country.
                    </p>
                  </div>

                  <Link
                    href={`/gyms/${slugify(
                      typedGym.country_full || getCountryName(typedGym.country)
                    )}`}
                    className="shrink-0 rounded-[10px] bg-[#0C0C0C] px-5 py-3 text-[13px] font-bold text-white transition hover:bg-[#222]"
                  >
                    View gym day passes in{" "}
                    {typedGym.country_full || getCountryName(typedGym.country)} →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
    <Footer />
</>
  );
}
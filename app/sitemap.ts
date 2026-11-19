import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { blogPosts } from "@/app/blog/posts";
import countriesList from "world-countries";
import { slugify } from "@/lib/slugify";
export const revalidate = 86400;

function getCountryName(code: string | null) {
  if (!code) return null;

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

  return country?.name.common || null;
}

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

  AU: {
    NSW: "New South Wales",
    VIC: "Victoria",
    QLD: "Queensland",
    WA: "Western Australia",
    SA: "South Australia",
    TAS: "Tasmania",
    ACT: "Australian Capital Territory",
    NT: "Northern Territory",
  },
};

type SitemapGym = {
  id: number;
  name: string;
  country: string | null;
  country_full: string | null;
  city: string | null;
};

type RegionStat = {
  country: string;
  state_code: string;
  gym_count: number;
  city_count: number;
};

async function getRegionStats(): Promise<RegionStat[]> {
  const { data, error } = await supabase.rpc(
    "get_region_stats",
    undefined,
    { get: true }
  );

  if (error) {
    console.error("Sitemap region stats error:", error);
    throw error;
  }

  return (data || []) as RegionStat[];
}

async function getAllGyms(): Promise<SitemapGym[]> {
  const { data, error } = await supabase.rpc(
    "get_sitemap_spots",
    undefined,
    { get: true }
  );

  if (error) {
    console.error("Sitemap spots error:", error);
    throw error;
  }

  return (data || []) as SitemapGym[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.daypassgyms.com";
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1, lastModified: now },
    { url: `${baseUrl}/map`, priority: 0.9, lastModified: now },
    { url: `${baseUrl}/gyms`, priority: 0.9, lastModified: now },
    { url: `${baseUrl}/blog`, priority: 0.8, lastModified: now },
    { url: `${baseUrl}/about`, priority: 0.6, lastModified: now },
    { url: `${baseUrl}/for-gym-owners`, priority: 0.6 },
    { url: `${baseUrl}/partnerships`, priority: 0.6 },
  ];

  blogPosts.forEach((post) => {
    urls.push({
      url: `${baseUrl}/blog/${post.slug}`,
      priority: 0.7,
      lastModified: new Date(post.updatedAt || post.publishedAt),
    });
  });

  const [gyms, regionStats] = await Promise.all([
    getAllGyms(),
    getRegionStats(),
  ]);

  if (gyms.length === 0) return urls;

  const countries = new Set<string>();
  const cities = new Set<string>();

  gyms.forEach((gym) => {
    urls.push({
      url: `${baseUrl}/gym/${slugify(gym.name)}-${gym.id}`,
      priority: 0.7,
    });

    const countryName =
      gym.country_full || getCountryName(gym.country);

    if (countryName) {
      countries.add(slugify(countryName));
    }

    if (countryName && gym.city) {
      cities.add(`${slugify(countryName)}/${slugify(gym.city)}`);
    }
  });

  countries.forEach((country) => {
    urls.push({
      url: `${baseUrl}/gyms/${country}`,
      priority: 0.8,
    });
  });

  regionStats.forEach((region) => {
    const countryCode = region.country?.toUpperCase();
    const stateCode = region.state_code?.toUpperCase();

    const countryName = getCountryName(countryCode);
    const regionName =
      REGION_NAMES[countryCode]?.[stateCode];

    if (!countryName || !regionName) return;

    urls.push({
      url:
        `${baseUrl}/gyms/${slugify(countryName)}` +
        `/region/${slugify(regionName)}`,
      priority: 0.8,
    });
  });

  cities.forEach((city) => {
    urls.push({
      url: `${baseUrl}/gyms/${city}`,
      priority: 0.8,
    });
  });

  return urls;
}
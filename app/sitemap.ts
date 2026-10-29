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

type SitemapGym = {
  id: number;
  name: string;
  country: string | null;
  country_full: string | null;
  city: string | null;
};

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

  const gyms = await getAllGyms();

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

  cities.forEach((city) => {
    urls.push({
      url: `${baseUrl}/gyms/${city}`,
      priority: 0.8,
    });
  });

  return urls;
}
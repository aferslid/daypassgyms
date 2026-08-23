import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { blogPosts } from "@/app/blog/posts";
import countriesList from "world-countries";
import { slugify } from "@/lib/slugify";

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

async function getAllGyms() {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const { data, error } = await supabase
      .from("spots")
      .select("id,name,country,country_full,city")
      .order("id")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    rows.push(...(data || []));

    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  return rows;
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
    { url: `${baseUrl}/for-gym-owners`, priority: 0.6, lastModified: now },
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
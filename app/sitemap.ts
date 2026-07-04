import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

function slugify(text: string) {
  return text
    .replace(/ß/g, "ss")
    .replace(/ẞ/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://daypassgyms.com";
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1, lastModified: now },
    { url: `${baseUrl}/map`, priority: 0.9, lastModified: now },
    { url: `${baseUrl}/gyms`, priority: 0.9, lastModified: now },
    { url: `${baseUrl}/suggest`, priority: 0.7, lastModified: now },
    { url: `${baseUrl}/about`, priority: 0.6, lastModified: now },
    { url: `${baseUrl}/for-gym-owners`, priority: 0.6, lastModified: now },
  ];

  const { data: gyms } = await supabase
    .from("spots")
    .select("id,name,country,country_full,city")
    .ilike("type", "%gym%");

  if (!gyms) return urls;

  const countries = new Set<string>();
  const cities = new Set<string>();

  gyms.forEach((gym) => {
    urls.push({
      url: `${baseUrl}/gym/${slugify(gym.name)}-${gym.id}`,
      priority: 0.7,
      lastModified: now,
    });

    const countryName = gym.country_full || gym.country;

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
      lastModified: now,
    });
  });

  cities.forEach((city) => {
    urls.push({
      url: `${baseUrl}/gyms/${city}`,
      priority: 0.8,
      lastModified: now,
    });
  });

  return urls;
}
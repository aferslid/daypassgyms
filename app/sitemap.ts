import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://daypassgyms.com";

  const urls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      priority: 1,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/map`,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/gyms`,
      priority: 0.9,
      lastModified: new Date(),
    },
    {
    url: `${baseUrl}/suggest`,
    priority: 0.7,
    lastModified: new Date(),
    },
  ];

  const { data: gyms } = await supabase
    .from("spots")
    .select("id,name,country,city")
    .ilike("type", "%gym%");

  if (!gyms) return urls;

  const countries = new Set<string>();
const cities = new Set<string>();

gyms.forEach((gym) => {
  urls.push({
    url: `${baseUrl}/gym/${slugify(gym.name)}-${gym.id}`,
    priority: 0.7,
    lastModified: new Date(),
  });

  if (gym.country) {
    countries.add(slugify(gym.country));
  }

  if (gym.country && gym.city) {
    cities.add(
      `${slugify(gym.country)}/${slugify(gym.city)}`
    );
  }
});

countries.forEach((country) => {
  urls.push({
    url: `${baseUrl}/gyms/${country}`,
    priority: 0.8,
    lastModified: new Date(),
  });
});

cities.forEach((city) => {
  urls.push({
    url: `${baseUrl}/gyms/${city}`,
    priority: 0.8,
    lastModified: new Date(),
  });
});

  return urls;
}
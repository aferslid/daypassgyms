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
    },
    {
      url: `${baseUrl}/map`,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gyms`,
      priority: 0.9,
    },
  ];

  const { data: gyms } = await supabase
    .from("spots")
    .select("id,name,country,city")
    .ilike("type", "%gym%");

  if (!gyms) return urls;

  gyms.forEach((gym) => {
    urls.push({
      url: `${baseUrl}/gym/${slugify(gym.name)}-${gym.id}`,
      priority: 0.7,
    });

    if (gym.country) {
      urls.push({
        url: `${baseUrl}/gyms/${slugify(gym.country)}`,
        priority: 0.8,
      });
    }

    if (gym.country && gym.city) {
      urls.push({
        url: `${baseUrl}/gyms/${slugify(gym.country)}/${slugify(gym.city)}`,
        priority: 0.8,
      });
    }
  });

  return urls;
}
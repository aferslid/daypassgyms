const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCityFromCoords(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "GymDayPassMap/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const data = await response.json();
  const address = data.address || {};

  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    null
  );
}

async function main() {
  const { data: gyms, error } = await supabase
    .from("spots")
    .select("id, name, lat, lng, country, city")
    .is("city", null)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("id")
    .limit(10);

  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log(`Testing ${gyms.length} gyms...\n`);

  for (const gym of gyms) {
    try {
      const city = await getCityFromCoords(gym.lat, gym.lng);

      console.log(`${gym.id} | ${gym.name}`);
      console.log(`→ ${gym.lat}, ${gym.lng}`);
      if (city) {
        const { error: updateError } = await supabase
            .from("spots")
            .update({ city })
            .eq("id", gym.id);

        if (updateError) {
            console.error(updateError);
        } else {
            console.log(`✅ Updated ${gym.name} → ${city}`);
        }
        }
      console.log("");

      await new Promise((resolve) => setTimeout(resolve, 1200));
    } catch (err) {
      console.error(`Error for ${gym.name}:`, err.message);
    }
  }
}

main();
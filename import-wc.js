const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ffcpucpunnsjdhxxwwae.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmY3B1Y3B1bm5zamRoeHh3d2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTU2MTEsImV4cCI6MjA5MDEzMTYxMX0.JzJysmYKed0JrQGhaSXzsUPF9lzTOPi5xNchY16lRdw";


const supabase = createClient(supabaseUrl, supabaseKey);

async function importWC() {
  const filePath = path.join(__dirname, "public", "wc.geojson");
  const raw = fs.readFileSync(filePath, "utf-8");
  const geojson = JSON.parse(raw);

  const features = geojson.features || geojson;

  const rows = features.map((feature) => {
    const coords = feature.geometry?.coordinates;
    const props = feature.properties || {};

    if (!coords || coords.length < 2) return null;

    const lng = coords[0];
    const lat = coords[1];

    const description = [
      props.adresse ? `Adresse: ${props.adresse}` : null,
      props.arrondissement ? `Arrondissement: ${props.arrondissement}` : null,
      props.horaire ? `Horaires: ${props.horaire}` : null,
      props.acces_pmr ? `PMR: ${props.acces_pmr}` : null,
      props.statut ? `Statut: ${props.statut}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      name: props.type || "WC public",
      type: "wc",
      lat,
      lng,
      description: description || null,
      user_id: null,
      photo_url: null,
      source: "wc_paris_open",
      country: "FR",
    };
  }).filter(Boolean);

  console.log(`Rows to import: ${rows.length}`);

  const chunkSize = 200;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const { error } = await supabase.from("spots").insert(chunk);

    if (error) {
      console.error("Import error:", error);
      return;
    }

    console.log(`Imported ${i + chunk.length}/${rows.length}`);
  }

  console.log("Import terminé.");
}

importWC();
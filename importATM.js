const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ffcpucpunnsjdhxxwwae.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmY3B1Y3B1bm5zamRoeHh3d2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTU2MTEsImV4cCI6MjA5MDEzMTYxMX0.JzJysmYKed0JrQGhaSXzsUPF9lzTOPi5xNchY16lRdw";


const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = path.join(__dirname, "public", "atm.geojson");
const raw = fs.readFileSync(filePath, "utf-8");
const geojson = JSON.parse(raw);

const rows = geojson.features.map((f) => ({
  name: f.properties.name || "ATM",
  type: "atm",
  lat: f.geometry.coordinates[1],
  lng: f.geometry.coordinates[0],
  description: `${f.properties.meta_name_com || ""} ${f.properties.meta_name_dep || ""}`,
  source: "open_data",
  country: "FR"
}));

async function run() {
  console.log("Total ATM:", rows.length);

  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const { error } = await supabase
      .from("spots")
      .insert(chunk);

    if (error) {
      console.error("Error:", error);
      return;
    }

    console.log("Inserted", i + chunk.length);
  }

  console.log("Done ATM import");
}

run();
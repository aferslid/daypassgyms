import { createClient } from "@supabase/supabase-js";

function slugify(text) {
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

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

const SITE_URL = "https://www.daypassgyms.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const SUPABASE_PAGE_SIZE = 1000;
const INDEXNOW_BATCH_SIZE = 1000;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL."
  );
}

if (!SUPABASE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

if (!INDEXNOW_KEY) {
  throw new Error("Missing INDEXNOW_KEY.");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function fetchAllGymSlugs() {
  const gyms = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("spots")
      .select("id, name")
      .not("name", "is", null)
      .order("id")
      .range(from, to);

    if (error) {
      throw new Error(
        `Supabase error: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      break;
    }

    gyms.push(...data);

    console.log(
      `Fetched ${gyms.length} gyms from Supabase...`
    );

    if (data.length < SUPABASE_PAGE_SIZE) {
      break;
    }

    from += SUPABASE_PAGE_SIZE;
  }

  return gyms;
}

function splitIntoBatches(items, batchSize) {
  const batches = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return batches;
}

async function submitBatch(urlList, batchNumber, totalBatches) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      host: "www.daypassgyms.com",
      key: INDEXNOW_KEY,
      keyLocation:
        `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Batch ${batchNumber}/${totalBatches} failed: ` +
        `${response.status} ${response.statusText} ` +
        responseText
    );
  }

  console.log(
    `Submitted batch ${batchNumber}/${totalBatches}: ` +
      `${urlList.length} URLs — HTTP ${response.status}`
  );
}

async function main() {
  console.log("Fetching existing gyms...");

  const gyms = await fetchAllGymSlugs();

  const urlList = [
    ...new Set(
        gyms
        .filter(
            (gym) =>
            gym.id !== null &&
            gym.id !== undefined &&
            typeof gym.name === "string" &&
            gym.name.trim()
        )
        .map(
            (gym) =>
            `${SITE_URL}/gym/${slugify(gym.name)}-${gym.id}`
        )
    ),
    ];

  if (urlList.length === 0) {
    console.log("No gym URLs found.");
    return;
  }

  console.log(
    `Found ${urlList.length} unique gym URLs.`
  );

  const batches = splitIntoBatches(
    urlList,
    INDEXNOW_BATCH_SIZE
  );

  for (let index = 0; index < batches.length; index += 1) {
    await submitBatch(
      batches[index],
      index + 1,
      batches.length
    );
  }

  console.log(
    `Done. ${urlList.length} existing gym URLs were submitted to IndexNow.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
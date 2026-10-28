import Header from "../components/Header";
import SuggestForm from "./SuggestForm";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add or Update a Gym",
  description:
    "Add a new gym or update an existing DayPassGyms listing.",
  robots: {
    index: false,
    follow: false,
  },
};

async function logSuggestVisit() {
  const h = await headers();

  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || null;

  const userAgent = h.get("user-agent");

  const country =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    null;

  const referer = h.get("referer");

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    await supabase.from("suggest_page_logs").insert({
      ip,
      user_agent: userAgent,
      country,
      referer,
    });
  } catch (error) {
    console.error("Suggest page logging error:", error);
  }
}

export default async function SuggestPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    owner?: string;
    gym?: string;
    city?: string;
    country?: string;
    spot_id?: string;
  }>;
}) {

  await logSuggestVisit();

  const params = await searchParams;

  const initialGymName = params.gym || "";
  const initialType =
  params.type === "update" || params.type === "owner"
    ? "update"
    : "new";

  const initialIsOwner =
  params.owner === "1" || params.type === "owner";
  const initialSpotId =
    params.spot_id && !Number.isNaN(Number(params.spot_id))
      ? Number(params.spot_id)
      : null;

  const initialCity = params.city || "";
  const initialCountry = params.country || "";

  const eyebrow = "GYM INFORMATION";

  const pageTitle = "Add or update a gym.";

  const pageDescription =
    "Help keep DayPassGyms accurate by adding a new gym or updating an existing listing.";
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="pb-16 pt-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
              {eyebrow}
            </p>

            <h1 className="mt-3 max-w-3xl text-[48px] font-extrabold leading-[0.95] tracking-[-2px] text-white md:text-[72px]">
              {pageTitle}
            </h1>

            <p className="mt-5 max-w-xl text-[17px] leading-7 text-[#B8B8B8]">
              {pageDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-8 md:p-10">
          <SuggestForm
            initialGymName={initialGymName}
            initialType={initialType}
            initialCity={initialCity}
            initialCountry={initialCountry}
            initialSpotId={initialSpotId}
            initialIsOwner={initialIsOwner}
          />
        </div>
      </section>
    </main>
  );
}
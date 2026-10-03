import Header from "../components/Header";
import SuggestForm from "./SuggestForm";

export const metadata = {
  title: "Suggest a Gym",
  description: "Suggest a gym with day passes to add to DayPassGyms.",
  robots: {
    index: false,
    follow: false,
  },
};

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
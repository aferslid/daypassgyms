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
    gym?: string;
    city?: string;
    country?: string;
    spot_id?: string;
  }>;
}) {
  const params = await searchParams;

  const initialGymName = params.gym || "";
  const initialType =
    params.type === "owner"
      ? "owner"
      : params.type === "update"
      ? "update"
      : "new";
  const initialSpotId =
    params.spot_id && !Number.isNaN(Number(params.spot_id))
      ? Number(params.spot_id)
      : null;
  const isOwner = initialType === "owner";
  const isUpdate = initialType === "update";

  const eyebrow = isOwner
    ? "GYM OWNER / MANAGER"
    : isUpdate
    ? "UPDATE A GYM"
    : "ADD A GYM";

  const pageTitle = isOwner
    ? "Update your gym listing."
    : isUpdate
    ? "Update a gym."
    : "Suggest a gym.";

  const pageDescription = isOwner
    ? "Keep your gym information accurate for travelers. No account required."
    : isUpdate
    ? "Found outdated or incorrect information? Send us the update and we’ll review it."
    : "Know a gym that offers day passes? Send it in and we’ll review it.";
  const initialCity = params.city || "";
  const initialCountry = params.country || "";
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
          />
        </div>
      </section>
    </main>
  );
}
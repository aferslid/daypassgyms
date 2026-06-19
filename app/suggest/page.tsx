import Header from "../components/Header";
import SuggestForm from "./SuggestForm";

export const metadata = {
  title: "Suggest a Gym | Gym Day Pass Map",
  description: "Suggest a gym with day passes to add to Gym Day Pass Map.",
};

export default function SuggestPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="pb-16 pt-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
              ADD A GYM
            </p>

            <h1 className="mt-3 max-w-3xl text-[48px] font-extrabold leading-[0.95] tracking-[-2px] text-white md:text-[72px]">
              Suggest a gym.
            </h1>

            <p className="mt-5 max-w-xl text-[17px] leading-7 text-[#B8B8B8]">
              Know a gym that offers day passes? Send it in and we’ll review it.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-8 md:p-10">
          <SuggestForm />
        </div>
      </section>
    </main>
  );
}
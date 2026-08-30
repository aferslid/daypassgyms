import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "For Gym Owners | DayPassGyms",
  description:
    "List your gym on DayPassGyms and reach travelers and digital nomads looking for day passes and flexible gym access.",
};

const benefits = [
  {
    title: "Reach travelers",
    text: "Get discovered by travelers and digital nomads actively looking for somewhere to train.",
  },
  {
    title: "Show your day-pass price",
    text: "Make it clear how much a single workout costs before visitors arrive.",
  },
  {
    title: "Highlight your facilities",
    text: "Show useful details such as showers, lockers, Wi-Fi and other amenities.",
  },
  {
    title: "Send visitors directly to you",
    text: "Your listing can point travelers to your website and Google Maps location.",
  },
];

export default function GymOwnersPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="pb-20 pt-16 md:pb-24 md:pt-20">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
              FOR GYM OWNERS
            </p>

            <h1 className="mt-3 max-w-4xl text-[48px] font-extrabold leading-[0.95] tracking-[-2px] text-white md:text-[72px]">
              Put your gym in front of
              <span className="text-[#C8F135]"> travelers.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[17px] leading-7 text-[#B8B8B8]">
              DayPassGyms helps people find gyms offering day passes, drop-ins
              and flexible access while traveling. Listing your gym is free.
            </p>

            <Link
              href="/suggest"
              className="mt-8 inline-flex rounded-[10px] bg-[#C8F135] px-6 py-3 text-[14px] font-bold text-[#0C0C0C] transition hover:opacity-90"
            >
              List your gym
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8BAA00]">
            WHY DAYPASSGYMS
          </p>

          <h2 className="mt-3 text-[36px] font-extrabold tracking-[-1.5px] text-[#0C0C0C] md:text-[48px]">
            Make your gym easier to discover.
          </h2>

          <p className="mt-4 text-[17px] leading-7 text-[#666]">
            Give travelers the information they need before they choose where
            to train.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-[20px] border border-[#E4E4E1] bg-white p-8 md:p-10"
            >
              <h3 className="text-[24px] font-extrabold tracking-[-0.7px] text-[#0C0C0C]">
                {item.title}
              </h3>

              <p className="mt-4 max-w-lg text-[15px] leading-7 text-[#666]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E4E4E1] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-[24px] bg-[#0C0C0C] px-8 py-12 md:px-12 md:py-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
              GET LISTED
            </p>

            <h2 className="mt-3 max-w-2xl text-[36px] font-extrabold leading-[1] tracking-[-1.5px] text-white md:text-[48px]">
              Add your gym to DayPassGyms.
            </h2>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#AFAFAF]">
              Submit your gym, day-pass price and facilities. We&apos;ll review
              the information before adding it to the directory.
            </p>

            <Link
              href="/suggest"
              className="mt-8 inline-flex rounded-[10px] bg-[#C8F135] px-6 py-3 text-[14px] font-bold text-[#0C0C0C] transition hover:opacity-90"
            >
              Suggest a gym →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
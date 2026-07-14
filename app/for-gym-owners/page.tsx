import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "For Gym Owners | DayPassGyms",
  description:
    "List your gym and help travelers and digital nomads discover your day passes.",
};

export default function GymOwnersPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F7F7F5]">
        <div className="mx-auto max-w-4xl px-6 py-20">

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
            For gym owners
          </p>

          <h1 className="mt-3 text-[48px] font-extrabold tracking-[-2px] text-[#0C0C0C]">
            List your gym for free
          </h1>

          <div className="mt-10 space-y-10 text-[18px] leading-8 text-[#555]">

            <section>
              <h2 className="text-[28px] font-extrabold text-[#0C0C0C]">
                Reach travelers and digital nomads
              </h2>

              <p className="mt-4">
                Many people only need a gym for a day or a week. We help them
                discover gyms offering flexible access around the world.
              </p>
            </section>

            <section>
              <h2 className="text-[28px] font-extrabold text-[#0C0C0C]">
                Add useful information
              </h2>

              <ul className="mt-4 space-y-2">
                <li>• Day pass price</li>
                <li>• Shower availability</li>
                <li>• Website and Google Maps link</li>
                <li>• Photos and facilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[28px] font-extrabold text-[#0C0C0C]">
                Submit your gym
              </h2>

              <p className="mt-4">
                Listing is free and helps travelers quickly find your gym.
              </p>

              <Link
                href="/suggest"
                className="mt-6 inline-block rounded-[12px] bg-[#0C0C0C] px-6 py-3 text-white font-bold"
              >
                Suggest a gym →
              </Link>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
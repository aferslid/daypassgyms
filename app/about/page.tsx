import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "About | Gym Day Pass Map",
  description:
    "Why we built Gym Day Pass Map and how we help travelers and digital nomads find gyms with day passes.",
};

export default function AboutPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F7F7F5]">
        <div className="mx-auto max-w-4xl px-6 py-20">

          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
            About
          </p>

          <h1 className="mt-3 text-[48px] font-extrabold tracking-[-2px] text-[#0C0C0C]">
            Why we built Gym Day Pass Map
          </h1>

          <div className="mt-10 space-y-10 text-[18px] leading-8 text-[#555]">

            <section>
              <h2 className="text-[28px] font-extrabold text-[#0C0C0C]">
                For travelers and digital nomads
              </h2>

              <p className="mt-4">
                Finding a gym when traveling is harder than it should be.
                Monthly memberships are often unnecessary and information about
                day passes is scattered.
              </p>
            </section>

            <section>
              <h2 className="text-[28px] font-extrabold text-[#0C0C0C]">
                What you can find
              </h2>

              <ul className="mt-4 space-y-2">
                <li>• Day pass prices</li>
                <li>• Shower information</li>
                <li>• Websites and Google Maps links</li>
                <li>• Gyms by city and country</li>
                <li>• New gyms added regularly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[28px] font-extrabold text-[#0C0C0C]">
                Help us improve
              </h2>

              <p className="mt-4">
                Know a gym offering day passes? Use the Suggest a Gym page to
                help us make the map better.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "Partnerships | DayPassGyms",
  description:
    "Partner with DayPassGyms to reach travelers and fitness-focused communities around the world.",
};

const partnershipTypes = [
  {
    title: "Gyms & fitness chains",
    text: "List your locations, keep your information up to date and help travelers discover where they can train.",
  },
  {
    title: "Travel brands",
    text: "Work with us on cross-promotion, useful travel content, member benefits and relevant affiliate partnerships.",
  },
  {
    title: "Travel & nomad communities",
    text: "Give your members an easier way to find gyms with flexible access wherever they travel.",
  },
  {
    title: "Creators & publishers",
    text: "Collaborate on destination guides, fitness travel content, data insights and stories powered by DayPassGyms.",
  },
];

export default function PartnershipsPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0C0C0C]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Header />

          <div className="pb-20 pt-16 md:pb-24 md:pt-20">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
              PARTNERSHIPS
            </p>

            <h1 className="mt-3 max-w-4xl text-[48px] font-extrabold leading-[0.95] tracking-[-2px] text-white md:text-[72px]">
              Let&apos;s build the future of
              <span className="text-[#C8F135]"> fitness travel.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[17px] leading-7 text-[#B8B8B8]">
              DayPassGyms helps travelers find gyms offering day passes,
              drop-ins and flexible access around the world. We partner with
              gyms, travel companies, communities, creators and brands serving
              the same audience.
            </p>
          </div>
        </div>
      </section>

      {/* PARTNERSHIP TYPES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8BAA00]">
            WORK WITH US
          </p>

          <h2 className="mt-3 text-[36px] font-extrabold tracking-[-1.5px] text-[#0C0C0C] md:text-[48px]">
            Different ways to partner.
          </h2>

          <p className="mt-4 text-[17px] leading-7 text-[#666]">
            We&apos;re open to collaborations that make traveling and staying
            active easier.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {partnershipTypes.map((item) => (
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
              LET&apos;S TALK
            </p>

            <h2 className="mt-3 max-w-2xl text-[36px] font-extrabold leading-[1] tracking-[-1.5px] text-white md:text-[48px]">
              Have an idea for DayPassGyms?
            </h2>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#AFAFAF]">
              Tell us about your company, community or project and how you
              would like to work together.
            </p>

            <a
              href="mailto:aferslid@gmail.com?subject=DayPassGyms Partnership"
              className="mt-8 inline-flex rounded-[10px] bg-[#C8F135] px-6 py-3 text-[14px] font-bold text-[#0C0C0C] transition hover:opacity-90"
            >
              Contact DayPassGyms
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
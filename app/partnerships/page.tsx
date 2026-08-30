import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "Partner with DayPassGyms",
  description:
    "Partner with DayPassGyms to reach travelers looking for gyms and day passes around the world.",
};

export default function PartnershipsPage() {
  return (
    <>
      <Header />

      <main
        style={{
          minHeight: "100vh",
          background: "#080808",
          color: "white",
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              color: "#c7ff00",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "18px",
            }}
          >
            Partnerships
          </p>

          <h1
            style={{
              fontSize: "clamp(48px, 7vw, 88px)",
              lineHeight: 0.95,
              marginBottom: "32px",
              maxWidth: "900px",
            }}
          >
            Grow with
            <br />
            <span style={{ color: "#c7ff00" }}>DayPassGyms.</span>
          </h1>

          <p
            style={{
              fontSize: "20px",
              lineHeight: 1.6,
              color: "#aaa",
              maxWidth: "720px",
              marginBottom: "70px",
            }}
          >
            DayPassGyms helps travelers discover gyms offering day passes,
            drop-ins and flexible access around the world. We are building
            partnerships with gyms, travel companies, communities, creators
            and brands that share the same audience.
          </p>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "80px",
            }}
          >
            {[
              {
                title: "Gyms & fitness chains",
                text: "Get your locations listed, update your information and reach travelers actively looking for places to train.",
              },
              {
                title: "Travel brands",
                text: "Collaborate through useful travel content, member benefits, cross-promotion and affiliate partnerships.",
              },
              {
                title: "Communities",
                text: "Give digital nomads, travelers and fitness communities an easier way to find gyms wherever they go.",
              },
              {
                title: "Creators & publishers",
                text: "Work with DayPassGyms on destination guides, fitness travel content, data insights and collaborations.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  border: "1px solid #252525",
                  borderRadius: "18px",
                  padding: "30px",
                  background: "#0d0d0d",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    marginBottom: "14px",
                  }}
                >
                  {item.title}
                </h2>

                <p
                  style={{
                    color: "#999",
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </section>

          <section
            style={{
              borderTop: "1px solid #222",
              paddingTop: "60px",
            }}
          >
            <h2
              style={{
                fontSize: "42px",
                marginBottom: "20px",
              }}
            >
              Want to work together?
            </h2>

            <p
              style={{
                color: "#aaa",
                fontSize: "18px",
                marginBottom: "30px",
              }}
            >
              Tell us about your company, community or idea and how you would
              like to collaborate with DayPassGyms.
            </p>

            <a
              href="mailto:hello@daypassgyms.com"
              style={{
                display: "inline-block",
                background: "#c7ff00",
                color: "#000",
                padding: "16px 26px",
                borderRadius: "10px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Contact DayPassGyms
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
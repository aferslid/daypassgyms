import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import { blogPosts, getBlogPost } from "../posts";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Article not found | DayPassGyms",
    };
  }

  return {
    title: `${post.title} | DayPassGyms`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F2F2F0] text-[#111]">
      <article>
        <section className="bg-[#111] text-white">
          <div className="mx-auto max-w-7xl px-6">
            <Header />

            <div className="mx-auto max-w-4xl pb-20 pt-16 md:pb-28 md:pt-24">
              <Link
                href="/blog"
                className="text-sm text-[#999] transition hover:text-white"
              >
                ← Back to blog
              </Link>

              <div className="mt-12 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8F135]">
                {post.category}
              </div>

              <h1 className="mt-5 text-5xl font-extrabold leading-[0.98] tracking-[-2.5px] md:text-7xl">
                {post.title}
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#999]">
                {post.excerpt}
              </p>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#777]">
                <span>{post.publishedAt}</span>
                <span>•</span>
                <span>{post.readingTime}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,760px)_280px] lg:py-24">
          <div className="min-w-0">
            <div className="space-y-12">
              {post.sections.map((section, sectionIndex) => (
                <section key={sectionIndex}>
                  {section.heading && (
                    <h2 className="text-3xl font-extrabold leading-tight tracking-[-1px]">
                      {section.heading}
                    </h2>
                  )}

                  {section.paragraphs && (
                    <div
                      className={
                        section.heading
                          ? "mt-5 space-y-5"
                          : "space-y-5"
                      }
                    >
                      {section.paragraphs.map(
                        (paragraph, paragraphIndex) => (
                          <p
                            key={paragraphIndex}
                            className="text-[17px] leading-8 text-[#444]"
                          >
                            {paragraph}
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {section.bullets && (
                    <ul className="mt-6 space-y-3">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <li
                          key={bulletIndex}
                          className="flex gap-3 text-[16px] leading-7 text-[#444]"
                        >
                          <span className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-[#A7C927]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-16 rounded-[20px] bg-[#111] p-8 text-white md:p-10">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8F135]">
                Find your next gym
              </div>

              <h2 className="mt-4 text-3xl font-extrabold tracking-[-1px]">
                Browse gyms offering temporary access.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-[#999]">
                Search by country and city, compare day-pass information and
                check useful facilities before you go.
              </p>

              <Link
                href="/gyms"
                className="mt-7 inline-flex rounded-[10px] bg-[#C8F135] px-5 py-3 text-sm font-bold text-[#111] transition hover:bg-[#D7FF45]"
              >
                Browse countries
              </Link>
            </div>
          </div>

          <aside className="h-fit lg:sticky lg:top-8">
            <div className="rounded-[18px] border border-[#DADAD5] bg-white p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#999]">
                Before visiting a gym
              </div>

              <div className="mt-5 space-y-4 text-sm text-[#555]">
                <div className="border-b border-[#ECECE7] pb-4">
                  Bring an ID or passport.
                </div>

                <div className="border-b border-[#ECECE7] pb-4">
                  Check the staffed hours.
                </div>

                <div className="border-b border-[#ECECE7] pb-4">
                  Carry a towel.
                </div>

                <div>
                  Check whether indoor shoes are required.
                </div>
              </div>
            </div>
          </aside>
        </section>
      </article>
    </main>
  );
}
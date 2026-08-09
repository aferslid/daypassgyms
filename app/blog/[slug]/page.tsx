import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import { blogPosts, getBlogPost, BlogPost } from "../posts";

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

  const articleUrl = `https://www.daypassgyms.com/blog/${post.slug}`;
  const imageUrl = "https://www.daypassgyms.com/og-image.png";

  const metaTitle = post.metaTitle ?? post.title;
  const metaDescription = post.metaDescription ?? post.excerpt;

  return {
    title: `${metaTitle} | DayPassGyms`,
    description: metaDescription,

    alternates: {
      canonical: articleUrl,
    },

    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: articleUrl,
      siteName: "DayPassGyms",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
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

  const relatedPosts: BlogPost[] = blogPosts
  .filter((p) => p.slug !== post.slug)
  .slice(0, 3);

  const baseUrl = "https://www.daypassgyms.com";
  const articleUrl = `${baseUrl}/blog/${post.slug}`;

  const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.excerpt,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt || post.publishedAt,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": articleUrl,
  },
  url: articleUrl,
  author: {
    "@type": "Organization",
    name: "DayPassGyms",
    url: baseUrl,
  },
  publisher: {
    "@type": "Organization",
    name: "DayPassGyms",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/og-image.png`,
    },
  },
  image: `${baseUrl}/og-image.png`,
  articleSection: post.category,
  inLanguage: "en",
};

  return (
    <main className="min-h-screen bg-[#F2F2F0] font-[family-name:var(--font-space)] text-[#111]">
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
        />

        <article>
        <section className="relative overflow-hidden bg-[#0C0C0C] text-white">
            <div className="relative mx-auto max-w-7xl px-6 py-5">
                <Header />

                <div className="max-w-4xl pb-20 pt-16 md:pb-28 md:pt-24">
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
                <span>
                {new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })}
                </span>
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

                  {section.links && section.links.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center rounded-[10px] border border-[#DADAD5] bg-white px-4 py-3 text-sm font-bold text-[#111] transition hover:border-[#A7C927] hover:text-[#6F8500]"
                        >
                          {link.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-16 border-t border-[#E8E8E8] pt-12">

                {relatedPosts.length > 0 && (
                    <>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7E9700]">
                        Related guides
                    </div>

                    <h2 className="mt-3 text-3xl font-extrabold tracking-[-1px]">
                        Keep exploring
                    </h2>

                    <p className="mt-3 max-w-2xl text-[#666]">
                        More travel fitness guides to help you work out while travelling.
                    </p>

                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        {relatedPosts.map((related) => (
                        <Link
                            key={related.slug}
                            href={`/blog/${related.slug}`}
                            className="rounded-[16px] border border-[#DADAD5] bg-white p-6 transition hover:-translate-y-1 hover:border-[#C8F135]"
                        >
                            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7E9700]">
                            {related.category}
                            </div>

                            <h3 className="mt-3 text-xl font-extrabold leading-tight">
                            {related.title}
                            </h3>

                            <p className="mt-4 text-[15px] leading-7 text-[#666]">
                            {related.excerpt}
                            </p>

                            <div className="mt-6 text-sm font-bold">
                            Read article →
                            </div>
                        </Link>
                        ))}
                    </div>
                    </>
                )}

                <div className="mt-12 flex flex-wrap gap-3">

                    <Link
                    href="/blog"
                    className="inline-flex items-center rounded-[10px] border border-[#DADAD5] bg-white px-5 py-3 text-sm font-bold text-[#111] transition hover:border-[#999]"
                    >
                    ← More travel guides
                    </Link>

                    <Link
                    href="/gyms"
                    className="inline-flex items-center rounded-[10px] bg-[#0C0C0C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#202020]"
                    >
                    Browse gyms →
                    </Link>

                </div>
                </div>

            <div className="mt-16 rounded-[20px] bg-[#111] p-8 text-white md:p-10">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8F135]">
                Ready for your next workout?
              </div>

              <h2 className="mt-4 text-3xl font-extrabold tracking-[-1px]">
                Find a gym that welcomes temporary visitors.
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-[#999]">
                Browse gyms by country and city, compare day-pass and weekly-pass
                prices, and check showers, lockers, Wi-Fi and visitor requirements
                before you go.
              </p>

              <Link
                href="/gyms"
                className="mt-7 inline-flex rounded-[10px] bg-[#C8F135] px-5 py-3 text-sm font-bold text-[#111] transition hover:bg-[#D7FF45]"
              >
                Find a gym →
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